$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$venv = Join-Path $root ".venv"
$python = Join-Path $venv "Scripts\python.exe"

if (-not (Test-Path $python)) {
    $base = "python"
    $baseArgs = @()
    if (Get-Command py -ErrorAction SilentlyContinue) {
        try {
            & py -3.10 -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" 2>$null
            if ($LASTEXITCODE -eq 0) {
                $base = "py"
                $baseArgs = @("-3.10")
            }
        } catch {
            # 没有 py 启动器时回退到 python
        }
    }
    Write-Host "正在创建本地 Python 环境：$venv"
    & $base @baseArgs -m venv $venv
}

& $python -c "import sys; assert sys.version_info >= (3, 10), '需要 Python 3.10 或更高版本'"
Write-Host "正在安装依赖..."
& $python -m pip install --upgrade pip
& $python -m pip install -r (Join-Path $root "backend\requirements.txt")

Write-Host ""
Write-Host "依赖安装完成。以后直接运行 start.cmd 即可。"
Write-Host "本机访问：http://127.0.0.1:5600"