@echo off
chcp 65001 >/dev/null
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*localtunnel*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host ('已停止公网隧道 PID ' + $_.ProcessId) }"
pause
