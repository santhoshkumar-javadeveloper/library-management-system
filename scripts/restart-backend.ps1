# Rebuild and start backend (fixes Mongoose/MongoDB driver issues).
# Run from project root: .\scripts\restart-backend.ps1
Set-Location (Split-Path $PSScriptRoot -Parent)
Write-Host "Stopping backend..."
docker-compose stop backend
Write-Host "Rebuilding backend image (this may take 1-2 min)..."
docker-compose build backend
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Starting database and backend..."
docker-compose up -d database backend
Write-Host "Waiting 15s for backend to start..."
Start-Sleep -Seconds 15
docker ps -a --filter "name=library-management-system-backend" --format "Backend: {{.Status}}"
Write-Host "Test API: http://127.0.0.1:3000/health"
