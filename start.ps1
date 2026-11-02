$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$port = 5600
$url = "http://127.0.0.1:$port"
$lanIp = (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null } | Select-Object -First 1).IPv4Address.IPAddress
$lanUrl = if ($lanIp) { "http://${lanIp}:$port" } else { $url }

$existing = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "爱师大已在运行：$url"
    Write-Host "同学访问：$lanUrl"
    Start-Process $url
    exit 0
}

$python = Join-Path $root "..\campus-smart-service\.venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    $python = "python"
}

Write-Host "使用 Python：$python"
Write-Host "启动后端：$url"
Start-Process -FilePath $python -ArgumentList @("backend/run.py") -WorkingDirectory $root -WindowStyle Hidden

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