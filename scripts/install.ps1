# CadixMod Windows Installer
# PowerShell script to install CadixMod on Windows

$ErrorActionPreference = "Stop"

$CADIXMOD_NAME = "CadixMod"
$CADIXMOD_VERSION = "1.1.0"
$DISCORD_PATHS = @(
    "$env:LOCALAPPDATA\Discord",
    "$env:APPDATA\Discord"
)

function Write-Status {
    param([string]$Message, [string]$Color = "Cyan")
    Write-Host "[$CADIXMOD_NAME] " -ForegroundColor $Color -NoNewline
    Write-Host $Message
}

function Write-Success {
    param([string]$Message)
    Write-Host "[*] " -ForegroundColor Green -NoNewline
    Write-Host $Message
}

function Write-Error {
    param([string]$Message)
    Write-Host "[X] " -ForegroundColor Red -NoNewline
    Write-Host $Message
}

function Find-DiscordPath {
    foreach ($path in $DISCORD_PATHS) {
        if (Test-Path $path) {
            return $path
        }
    }
    return $null
}

function Install-CadixMod {
    Write-Status "Installing $CADIXMOD_NAME v$CADIXMOD_VERSION..."

    $discordPath = Find-DiscordPath
    if (-not $discordPath) {
        Write-Error "Discord not found. Please install Discord first."
        exit 1
    }

    Write-Status "Found Discord at: $discordPath"

    $resourcesPath = Join-Path $discordPath "resources"
    $asarPath = Join-Path $resourcesPath "app.asar"
    $backupPath = Join-Path $resourcesPath "app.asar.backup"

    if (-not (Test-Path $asarPath)) {
        Write-Error "app.asar not found at: $asarPath"
        exit 1
    }

    if (Test-Path $backupPath) {
        Write-Status "Backup already exists, skipping..."
    } else {
        Write-Status "Creating backup of app.asar..."
        Copy-Item -Path $asarPath -Destination $backupPath -Force
    }

    $scriptDir = Split-Path -Parent $PSScriptRoot
    $distPath = Join-Path $scriptDir "dist"

    if (-not (Test-Path $distPath)) {
        Write-Status "Building $CADIXMOD_NAME..."
        & npm run build
    }

    $appDir = Join-Path $resourcesPath "app"
    if (-not (Test-Path $appDir)) {
        New-Item -ItemType Directory -Path $appDir -Force | Out-Null
    }

    $indexContent = @"
const { app, BrowserWindow, session } = require('electron');
const { join } = require('path');
const { existsSync, readFileSync } = require('fs');

const asarBackup = join(__dirname, '..', 'app.asar.backup');
const cadixmodMain = join(__dirname, '..', 'cadixmod', 'main', 'index.js');

if (existsSync(cadixmodMain)) {
    require(cadixmodMain);
}

if (existsSync(asarBackup)) {
    const originalApp = require(asarBackup);
    if (typeof originalApp === 'function') {
        module.exports = originalApp;
    }
}
"@

    Set-Content -Path (Join-Path $appDir "index.js") -Value $indexContent

    $packageContent = @"
{
    "name": "cadixmod-discord",
    "version": "$CADIXMOD_VERSION",
    "main": "index.js"
}
"@

    Set-Content -Path (Join-Path $appDir "package.json") -Value $packageContent

    $cadixmodDist = Join-Path $resourcesPath "cadixmod"
    if (-not (Test-Path $cadixmodDist)) {
        New-Item -ItemType Directory -Path $cadixmodDist -Force | Out-Null
    }

    Copy-Item -Path (Join-Path $distPath "*") -Destination $cadixmodDist -Recurse -Force

    Write-Success "$CADIXMOD_NAME installed successfully!"
    Write-Status "Please restart Discord to apply changes."
}

function Uninstall-CadixMod {
    Write-Status "Uninstalling $CADIXMOD_NAME..."

    $discordPath = Find-DiscordPath
    if (-not $discordPath) {
        Write-Error "Discord not found."
        exit 1
    }

    $resourcesPath = Join-Path $discordPath "resources"
    $backupPath = Join-Path $resourcesPath "app.asar.backup"
    $asarPath = Join-Path $resourcesPath "app.asar"
    $appDir = Join-Path $resourcesPath "app"
    $cadixmodDist = Join-Path $resourcesPath "cadixmod"

    if (Test-Path $backupPath) {
        Remove-Item -Path $asarPath -Force -ErrorAction SilentlyContinue
        Rename-Item -Path $backupPath -NewName "app.asar" -Force
        Write-Success "Restored original app.asar"
    }

    if (Test-Path $appDir) {
        Remove-Item -Path $appDir -Recurse -Force
    }

    if (Test-Path $cadixmodDist) {
        Remove-Item -Path $cadixmodDist -Recurse -Force
    }

    Write-Success "$CADIXMOD_NAME uninstalled successfully!"
    Write-Status "Please restart Discord to apply changes."
}

switch ($args[0]) {
    "uninstall" { Uninstall-CadixMod }
    default { Install-CadixMod }
}
