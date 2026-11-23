$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$venv = Join-Path $root ".venv"
$python = Join-Path $venv "Scripts\python.exe"

function Test-Pip($py) {
    & $py -m pip --version *> $null
    return ($LASTEXITCODE -eq 0)
}

if (-not (Test-Path $python)) {
    $base = $null
    $baseArgs = @()
    # 优先 Windows 官方 py 启动器（其 venv 自带 pip）
    if (Get-Command py -ErrorAction SilentlyContinue) {
        try { & py -3.10 -c "import sys" 2>$null; if ($LASTEXITCODE -eq 0) { $base = "py"; $baseArgs = @("-3.10") } } catch {}
        if (-not $base) {
            try { & py -3 -c "import sys" 2>$null; if ($LASTEXITCODE -eq 0) { $base = "py"; $baseArgs = @("-3") } } catch {}
        }
    }
    if (-not $base -and (Get-Command python -ErrorAction SilentlyContinue)) { $base = "python" }
    if (-not $base) {
        Write-Host "未找到 Python。请安装 Python 3.10 或更高版本（安装时勾选 Add Python to PATH 与 pip）后重试。"
        exit 1
    }
    Write-Host "正在创建本地 Python 环境：$venv"
    & $base @baseArgs -m venv $venv
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $python)) {
        Write-Host "创建虚拟环境失败。请确认 Python 3.10+ 已正确安装。"
        exit 1
    }
}

# pip 自愈：Anaconda 等环境用 python -m venv 建出的 .venv 可能不带 pip
if (-not (Test-Pip $python)) {
    Write-Host "当前虚拟环境缺少 pip，正在尝试自动修复（ensurepip）..."
    & $python -m ensurepip --upgrade
    if ($LASTEXITCODE -ne 0 -or -not (Test-Pip $python)) {
        Write-Host ""
        Write-Host "pip 自动修复失败（常见于 Anaconda 环境）。请任选一种方式继续："
        Write-Host "  方式 A：安装 Windows 官方 Python 3.10+（勾选 pip），再重新运行 setup.cmd"
        Write-Host "  方式 B：在 Anaconda Prompt 中执行："
        Write-Host "    conda create -n sumate python=3.10 -y"
        Write-Host "    conda run -n sumate pip install -r backend\requirements.txt"
        Write-Host "    conda run -n sumate python backend\run.py"
        exit 1
    }
    Write-Host "pip 已修复。"
}

# 绕过本机残留系统代理（Clash/公司代理配置异常时会导致 pip TLS 失败）
Remove-Item Env:HTTP_PROXY -ErrorAction SilentlyContinue
Remove-Item Env:HTTPS_PROXY -ErrorAction SilentlyContinue
$env:NO_PROXY = "*"

$mirror = "https://pypi.tuna.tsinghua.edu.cn/simple"
& $python -m pip install --upgrade pip -i $mirror --timeout 60
$req = Join-Path $root "backend\requirements.txt"
Write-Host "正在安装依赖（清华镜像，约 1–3 分钟）..."
& $python -m pip install -r $req -i $mirror --timeout 60
if ($LASTEXITCODE -ne 0) {
    Write-Host "镜像源安装失败（退出码 $LASTEXITCODE），尝试官方源..."
    & $python -m pip install -r $req --timeout 60
}
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "依赖安装失败。请检查网络连接后重试，或手动执行："
    Write-Host "  .venv\Scripts\python.exe -m pip install -r backend\requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple"
    exit 1
}

& $python -c "import fastapi, uvicorn, sqlalchemy"
if ($LASTEXITCODE -ne 0) {
    Write-Host "依赖校验失败，请重新运行 setup.cmd。"
    exit 1
}

Write-Host ""
Write-Host "依赖安装完成。以后直接运行 start.cmd 即可。"
Write-Host "本机访问：http://127.0.0.1:5600"
