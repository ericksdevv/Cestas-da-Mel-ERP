$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot 'backend'
$environmentFile = Join-Path $backendPath '.env.local'

foreach ($line in Get-Content -LiteralPath $environmentFile) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
    $separator = $trimmed.IndexOf('=')
    if ($separator -lt 1) { continue }
    [Environment]::SetEnvironmentVariable($trimmed.Substring(0, $separator).Trim(), $trimmed.Substring($separator + 1).Trim(), 'Process')
}

Push-Location $backendPath
try {
    $dockerCommand = Get-Command docker -ErrorAction SilentlyContinue
    $dockerExecutable = if ($dockerCommand) { $dockerCommand.Source } else { Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\resources\bin\docker.exe' }
    if (-not (Test-Path -LiteralPath $dockerExecutable)) { throw 'Docker Desktop não foi encontrado.' }
    & $dockerExecutable compose stop
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível encerrar os serviços.' }
} finally {
    Pop-Location
}

Write-Host 'Banco e API encerrados. Se o Expo ainda estiver aberto, pressione Ctrl+C na janela dele.' -ForegroundColor Green
