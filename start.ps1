$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$port = 5600
$url = "http://127.0.0.1:$port"
$lanIp = (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null } | Select-Object -First 1).IPv4Address.IPAddress
$lanUrl = if ($lanIp) { "http://${lanIp}:$port" } else { $url }

$existing = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "苏小师已在运行：$url"
    Write-Host "同学访问：$lanUrl"
    Start-Process $url
    exit 0
}

$python = Join-Path $root ".venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    $python = Join-Path $root "..\campus-smart-service\.venv\Scripts\python.exe"
}
if (-not (Test-Path $python)) {
    Write-Host "未找到 Python 环境。首次运行请先执行 setup.cmd 安装依赖（需要 Python 3.10+）。"
    exit 1
}

# 启动前校验依赖，避免依赖缺失时只显示“启动超时”
& $python -c "import fastapi, uvicorn, sqlalchemy" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "依赖未安装或不完整，请先运行 setup.cmd（首次安装约 1–3 分钟）。"
    exit 1
}

Write-Host "使用 Python：$python"
Write-Host "启动后端：$url"
# 用 WMI 启动独立进程，避免随启动窗口关闭被系统回收
$cmd = "cmd /c cd /d `"$root`" && `"$python`" backend/run.py > backend\server.log 2>&1"
$created = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmd }
if ($created.ReturnValue -ne 0) {
    Write-Host "进程创建失败，ReturnValue=$($created.ReturnValue)"
    exit 1
}

for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    try {
        $res = Invoke-WebRequest -Uri "$url/api/health" -UseBasicParsing -TimeoutSec 2
        if ($res.StatusCode -eq 200) {
            Write-Host "启动成功。本机：$url  同学访问：$lanUrl"
            Start-Process $url
            exit 0
        }
    } catch {
        # still starting
    }
}

Write-Host "启动超时，请查看 backend/server.log"
exit 1
