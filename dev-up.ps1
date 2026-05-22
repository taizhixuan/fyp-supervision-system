# Hybrid dev startup: Docker for infra (db + AI services), host for backend + frontend.
# Use this when you want fast Spring restarts and live Vite HMR without running
# the backend/frontend containers.
#
# Usage:
#   .\dev-up.ps1            # start db + AI in Docker, then open backend + frontend terminals
#   .\dev-up.ps1 -StopOnly  # just stop the Docker infra services
#
# Notes:
# - Backend reads localhost:3307 via the 'dev' Spring profile (application-dev.yml).
# - Don't also have the Docker 'backend' / 'frontend' containers running — they'd
#   collide on ports 8080 / 5173 and the upload folder would diverge.

param(
    [switch]$StopOnly
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

if ($StopOnly) {
    Write-Host "Stopping infra services..." -ForegroundColor Yellow
    docker compose -f "$Root\docker-compose.yml" stop db ai-recommendation ai-proposal-analyzer ai-chatbot
    exit 0
}

# Load project-root .env so host-run backend (mvn spring-boot:run) sees the same
# vars the Dockerised stack would inject (mail creds, JWT secret, LLM keys, etc).
# Child processes spawned via Start-Process inherit this shell's environment.
$EnvFile = Join-Path $Root ".env"
if (Test-Path $EnvFile) {
    Write-Host "Loading .env into shell environment..." -ForegroundColor Cyan
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -match "^([^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim().Trim('"').Trim("'")
            Set-Item -Path "env:$key" -Value $val
        }
    }
}

Write-Host "Starting infra: db + 3 AI services..." -ForegroundColor Cyan
docker compose -f "$Root\docker-compose.yml" up -d db ai-recommendation ai-proposal-analyzer ai-chatbot

Write-Host "Waiting for MySQL on 3307..." -ForegroundColor Cyan
$timeout = 60
$elapsed = 0
while ($elapsed -lt $timeout) {
    $tcp = Test-NetConnection -ComputerName localhost -Port 3307 -WarningAction SilentlyContinue
    if ($tcp.TcpTestSucceeded) { break }
    Start-Sleep -Seconds 2
    $elapsed += 2
}
if ($elapsed -ge $timeout) {
    Write-Warning "MySQL on 3307 didn't come up in $timeout s — check 'docker compose ps'."
} else {
    Write-Host "MySQL is up." -ForegroundColor Green
}

Write-Host "Launching backend (mvn spring-boot:run, profile=dev) in a new window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$Root\backend'; mvn spring-boot:run '-Dspring-boot.run.profiles=dev'"
)

Write-Host "Launching frontend (npm run dev) in a new window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$Root\frontend'; npm run dev"
)

Write-Host ""
Write-Host "Done. URLs:" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000"
Write-Host "  Backend:  http://localhost:8080/api"
Write-Host "  AI:       :5001 (recommendation)  :5002 (analyzer)  :5003 (chatbot)"
Write-Host ""
Write-Host "To stop infra later:  .\dev-up.ps1 -StopOnly"
