@echo off
chcp 65001 >nul
echo ============================================
echo   苏小师 · 手机访问防火墙放行（需管理员）
echo ============================================
echo.
netsh advfirewall firewall add rule name="AiShida 5600" dir=in action=allow protocol=TCP localport=5600 profile=any >nul 2>&1
if %errorlevel%==0 (
    echo [成功] 防火墙已放行 5600 端口。
) else (
    echo [失败] 请右键本文件，选择"以管理员身份运行"。
)
echo.
echo 现在手机连上同一个热点，访问：
for /f "tokens=2 delims=:" %%a in ('netsh interface ip show addresses ^| findstr /i "IPv4"') do echo    http:%%a:5600
echo.
pause