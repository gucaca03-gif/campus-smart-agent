@echo off
chcp 65001 >nul
powershell -NoProfile -Command "$p = (Get-NetTCPConnection -LocalPort 5600 -State Listen -ErrorAction SilentlyContinue).OwningProcess; if ($p) { Stop-Process -Id $p -Force; Write-Host '爱师大已停止' } else { Write-Host '爱师大未在运行' }"
pause