# build.ps1 - Windows PowerShell script to build the application
# Mimics 'make build' behavior

$ErrorActionPreference = "Stop"

Write-Host "📦 Building web UI..." -ForegroundColor Cyan
Push-Location web
try {
    # Check if pnpm is installed, otherwise use npm
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm install
        pnpm build
    }
    else {
        npm install
        npm run build
    }
}
finally {
    Pop-Location
}

Write-Host "🔨 Building Go binary (embed web UI)..." -ForegroundColor Cyan
go build -buildvcs=false -tags embed -o letterofheart.exe ./cmd/server
if ($LASTEXITCODE -ne 0) {
    Write-Error "Go build failed!"
    exit $LASTEXITCODE
}

Write-Host "`n✅ Build Successful!" -ForegroundColor Green
Write-Host "👉 Start the app using: .\letterofheart.exe" -ForegroundColor Green
Write-Host "👉 Access the app at:  http://localhost:5000" -ForegroundColor Green
