@echo off
chcp 65001 >nul
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo 需要管理员权限：请右键本文件，选择“以管理员身份运行”。
  echo.
  pause
  exit /b 1
)
netsh advfirewall firewall delete rule name="苏小师 5600" >nul 2>&1
netsh advfirewall firewall add rule name="苏小师 5600" dir=in action=allow protocol=TCP localport=5600 profile=any
if %errorlevel% equ 0 (
  echo.
  echo 已放行 TCP 5600，同学可通过本机局域网 IP 访问。
) else (
  echo.
  echo 放行失败，请检查 Windows 防火墙设置。
)
pause