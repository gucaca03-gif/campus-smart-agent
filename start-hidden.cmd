@echo off
cd /d "%~dp0"
if exist ".venv\Scripts\python.exe" (
  set "PY=.venv\Scripts\python.exe"
) else (
  set "PY=..\campus-smart-service\.venv\Scripts\python.exe"
)
if not exist "%PY%" (
  echo 未找到 Python 环境，请先运行 setup.cmd 安装依赖。
  pause
  exit /b 1
)
if not exist "logs" mkdir logs
"%PY%" backend\run.py > "logs\server.log" 2>&1