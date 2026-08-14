$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'
$environmentFile = Join-Path $backendPath '.env.local'

$Host.UI.RawUI.WindowTitle = 'Cestas da Mel - Servidores'
Write-Host ''
Write-Host '  Cestas da Mel' -ForegroundColor Yellow
Write-Host '  Preparando o sistema...' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path -LiteralPath $environmentFile)) {
    throw 'Configuração local não encontrada em backend\.env.local.'
}

foreach ($line in Get-Content -LiteralPath $environmentFile) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
    $separator = $trimmed.IndexOf('=')
    if ($separator -lt 1) { continue }
    $name = $trimmed.Substring(0, $separator).Trim()
    $value = $trimmed.Substring($separator + 1).Trim()
    [Environment]::SetEnvironmentVariable($name, $value, 'Process')
}

$dockerCommand = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCommand) {
    $dockerExecutable = Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\resources\bin\docker.exe'
    if (-not (Test-Path -LiteralPath $dockerExecutable)) {
        throw 'Docker Desktop não foi encontrado. Instale ou abra o Docker Desktop e tente novamente.'
    }
} else {
    $dockerExecutable = $dockerCommand.Source
}

& $dockerExecutable info *> $null
if ($LASTEXITCODE -ne 0) {
    $dockerDesktop = Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe'
    if (-not (Test-Path -LiteralPath $dockerDesktop)) {
        throw 'Abra o Docker Desktop e execute este comando novamente.'
    }
    Write-Host '  Abrindo o Docker Desktop...' -ForegroundColor DarkCyan
    Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
    $dockerReady = $false
    for ($attempt = 0; $attempt -lt 45; $attempt++) {
        Start-Sleep -Seconds 2
        & $dockerExecutable info *> $null
        if ($LASTEXITCODE -eq 0) { $dockerReady = $true; break }
    }
    if (-not $dockerReady) { throw 'O Docker Desktop não ficou pronto a tempo.' }
}

Push-Location $backendPath
try {
    Write-Host '  Iniciando banco de dados e sistema...' -ForegroundColor DarkCyan
    & $dockerExecutable compose up -d --build
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível iniciar o banco e a API.' }
} finally {
    Pop-Location
}

Write-Host '  Aguardando o sistema ficar pronto...' -ForegroundColor DarkCyan
$apiReady = $false
for ($attempt = 0; $attempt -lt 45; $attempt++) {
    try {
        $health = Invoke-RestMethod -Uri 'http://localhost:8080/api/health' -TimeoutSec 2
        if ($health.status -eq 'UP') { $apiReady = $true; break }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $apiReady) {
    Push-Location $backendPath
    try { & $dockerExecutable compose logs --tail 80 api } finally { Pop-Location }
    throw 'A API não iniciou corretamente. O diagnóstico foi exibido acima.'
}

Push-Location $frontendPath
try {
    $expoCommand = Join-Path $frontendPath 'node_modules\.bin\expo.cmd'
    if (-not (Test-Path -LiteralPath $expoCommand)) {
        Write-Host '  Instalando os componentes do aplicativo...' -ForegroundColor DarkCyan
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'Não foi possível preparar o aplicativo.' }
    }

    Write-Host ''
    Write-Host '  Tudo pronto. O QR Code aparecerá abaixo.' -ForegroundColor Green
    Write-Host '  Pressione Ctrl+C para fechar o Expo.' -ForegroundColor DarkGray
    Write-Host ''
    & $expoCommand start --lan --clear --port 8081
} finally {
    Pop-Location
}
