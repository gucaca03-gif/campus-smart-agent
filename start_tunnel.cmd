@echo off
chcp 65001 >/dev/null
cd /d "%~dp0"
echo 正在启动公网隧道，请稍候...
start /b cmd /c "npx --yes localtunnel --port 5600 > backend\tunnel.log 2>&1"
timeout /t 15 >/dev/null
echo.
echo === 隧道地址 ===
type backend\tunnel.log
echo.
echo === 访问密码 ===
curl --ssl-no-revoke -s https://loca.lt/mytunnelpassword
echo.
echo 把上面的地址和密码发给同学；关闭隧道运行 stop_tunnel.cmd。
pause
