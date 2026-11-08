@echo off
chcp 65001 >nul
powershell -NoProfile -Command "$p = (Get-NetTCPConnection -LocalPort 5600 -State Listen -ErrorAction SilentlyContinue).OwningProcess; if ($p) { Stop-Process -Id $p -Force; Write-Host '苏小师已停止' } else { Write-Host '苏小师未在运行' }"
pause