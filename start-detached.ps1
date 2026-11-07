$ErrorActionPreference = "Stop"
# 以 WMI/CIM 托管方式启动后端，脱离当前 shell 会话的进程树，
# 解决"bash 会话结束后 Start-Process 衍生进程被一并回收"的问题。
$py = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $py)) {
    $py = Join-Path $PSScriptRoot "..\campus-smart-service\.venv\Scripts\python.exe"
}
if (-not (Test-Path $py)) {
    Write-Host "未找到 Python 环境。首次运行请先执行 setup.cmd 安装依赖（需要 Python 3.10+）。"
    exit 1
}

$existing = Get-NetTCPConnection -LocalPort 5600 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "爱师大已在运行：http://127.0.0.1:5600"
    exit 0
}

$cmd = '"' + $py + '" "' + (Join-Path $PSScriptRoot "backend\run.py") + '"'
$ret = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine    = $cmd
    CurrentDirectory = $PSScriptRoot
}
if ($ret.ReturnValue -ne 0) {
    Write-Host "启动失败，ReturnValue = $($ret.ReturnValue)"
    exit 1
}
Write-Host "已创建服务进程 PID $($ret.ProcessId)（独立于当前会话）"

for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    try {
        $res = Invoke-WebRequest -Uri "http://127.0.0.1:5600/api/health" -UseBasicParsing -TimeoutSec 2
        if ($res.StatusCode -eq 200) { Write-Host "启动成功：http://127.0.0.1:5600"; exit 0 }
    } catch { }
}
Write-Host "等待超时，请查看 backend/server.log"
exit 1