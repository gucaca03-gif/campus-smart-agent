$root = 'D:\桌面\shixi\hw\campus-smart-agent'
$py = 'D:\桌面\shixi\hw\campus-smart-service\.venv\Scripts\python.exe'
$cmd = "cmd /c cd /d `"$root`" && `"$py`" backend/run.py > backend/server.log 2>&1"
$result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmd }
Write-Host ("ReturnValue=" + $result.ReturnValue + " ProcessId=" + $result.ProcessId)