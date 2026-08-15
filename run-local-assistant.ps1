param(
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverRoot = Join-Path $root "server"
$envPath = Join-Path $serverRoot ".env"
$createdEnv = $false

function Test-PortInUse([int]$Port) {
    return [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw "未找到 Python，请先安装 Python 3.10+ 并确认 python 命令可用。"
}

if (-not (Test-Path $envPath)) {
    $examplePath = Join-Path $serverRoot '.env.example'
    Copy-Item -LiteralPath $examplePath -Destination $envPath
    $token = (& python -c 'import secrets; print(secrets.token_urlsafe(32))').Trim()
    $envText = Get-Content -Raw -Encoding UTF8 $envPath
    $envText = $envText -replace '(?m)^ASSISTANT_ACCESS_TOKEN=.*$', ('ASSISTANT_ACCESS_TOKEN=' + $token)
    $createdEnv = $true
}

# Local mode binds the services to loopback, so the browser does not need a second token.
$envText = Get-Content -Raw -Encoding UTF8 $envPath
if ($envText -match '(?m)^LOCAL_ONLY=') {
    $envText = $envText -replace '(?m)^LOCAL_ONLY=.*$', 'LOCAL_ONLY=true'
} else {
    $envText = $envText.TrimEnd() + "`nLOCAL_ONLY=true`n"
}
$utf8NoBom = New-Object -TypeName System.Text.UTF8Encoding -ArgumentList $false
[System.IO.File]::WriteAllText($envPath, $envText, $utf8NoBom)
if ($createdEnv) {
    Write-Host "已创建 server\.env，并启用本地模式。"
    Write-Host "请先打开 server\.env 填写 OPENAI_API_KEY，再重新运行本脚本。" -ForegroundColor Yellow
    Start-Process notepad.exe -ArgumentList $envPath
    exit 0
}

if (-not (Test-PortInUse 8787)) {
    Start-Process python `
        -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8787") `
        -WorkingDirectory $serverRoot `
        -WindowStyle Hidden
}

if (-not (Test-PortInUse 8000)) {
    Start-Process python `
        -ArgumentList @("-m", "http.server", "8000", "--bind", "127.0.0.1") `
        -WorkingDirectory $root `
        -WindowStyle Hidden
}

Start-Sleep -Milliseconds 700
Write-Host "AI 助手已启动：" -ForegroundColor Green
Write-Host "网站：http://127.0.0.1:8000/"
Write-Host "后端：http://127.0.0.1:8787/health"
Write-Host "配置文件：$envPath"
if (-not $NoBrowser) {
    Start-Process "http://127.0.0.1:8000/"
}
