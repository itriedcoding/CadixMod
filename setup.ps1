# CadixMod Setup Script
# Run this to set up the project for development or building

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  CadixMod - Discord Client Mod Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "[X] Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "[*] Node.js $nodeVersion found" -ForegroundColor Green

# Check npm
$npmVersion = npm --version 2>$null
if (-not $npmVersion) {
    Write-Host "[X] npm not found" -ForegroundColor Red
    exit 1
}
Write-Host "[*] npm $npmVersion found" -ForegroundColor Green

# Install root dependencies
Write-Host ""
Write-Host "[*] Installing root dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Failed to install root dependencies" -ForegroundColor Red
    exit 1
}

# Install app dependencies
Write-Host ""
Write-Host "[*] Installing desktop app dependencies..." -ForegroundColor Cyan
Push-Location app
npm install
Pop-Location
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Failed to install app dependencies" -ForegroundColor Red
    exit 1
}

# Build mod
Write-Host ""
Write-Host "[*] Building mod..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Failed to build mod" -ForegroundColor Red
    exit 1
}

# Build desktop app
Write-Host ""
Write-Host "[*] Building desktop app..." -ForegroundColor Cyan
Push-Location app
npm run build
Pop-Location
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Failed to build desktop app" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "To run the desktop app:" -ForegroundColor Yellow
Write-Host "  cd app; npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "To build installers:" -ForegroundColor Yellow
Write-Host "  cd app; npm run dist:win    # Windows" -ForegroundColor White
Write-Host "  cd app; npm run dist:linux  # Linux" -ForegroundColor White
Write-Host "  cd app; npm run dist:mac    # macOS" -ForegroundColor White
Write-Host ""
Write-Host "To inject directly into Discord:" -ForegroundColor Yellow
Write-Host "  node scripts/inject.mjs" -ForegroundColor White
Write-Host ""
