# Run k6 load test via Docker (no local k6 install needed).
# Ensure backend is running first: docker-compose up -d (API at 127.0.0.1:3000).
# Usage:
#   .\scripts\run-k6.ps1           # smoke test (~30s)
#   .\scripts\run-k6.ps1 -Full     # full load test (~5m)

param([switch]$Full)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$testDir = Join-Path $root "k6-tests"

# From Docker container, host API is at host.docker.internal (Windows/Mac)
$baseUrl = "http://host.docker.internal:3000"

if ($Full) {
  Write-Host "Running full k6 load test (~5 min) against $baseUrl ..."
  docker run --rm -v "${testDir}:/scripts" -e BASE_URL=$baseUrl grafana/k6:latest run /scripts/load-test.js
} else {
  Write-Host "Running k6 smoke test (~30s) against $baseUrl ..."
  docker run --rm -v "${testDir}:/scripts" -e BASE_URL=$baseUrl grafana/k6:latest run /scripts/smoke-test.js
}

if ($LASTEXITCODE -eq 0) { Write-Host "`nK6 test passed. You can proceed with video recording." -ForegroundColor Green }
else { Write-Host "`nK6 test had failures. Check output above." -ForegroundColor Yellow; exit $LASTEXITCODE }
