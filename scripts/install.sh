#!/bin/bash
# CadixMod Linux Installer
# Bash script to install CadixMod on Linux

set -e

CADIXMOD_NAME="CadixMod"
CADIXMOD_VERSION="1.1.0"

DISCORD_PATHS=(
    "$HOME/.config/discord"
    "$HOME/.local/share/Discord"
    "/usr/lib/discord"
    "/opt/Discord"
    "/snap/discord/current"
)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

write_status() {
    echo -e "${CYAN}[$CADIXMOD_NAME]${NC} $1"
}

write_success() {
    echo -e "${GREEN}[*]${NC} $1"
}

write_error() {
    echo -e "${RED}[X]${NC} $1"
}

write_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

find_discord_path() {
    for path in "${DISCORD_PATHS[@]}"; do
        if [ -d "$path" ]; then
            echo "$path"
            return 0
        fi
    done
    return 1
}

install_cadixmod() {
    write_status "Installing $CADIXMOD_NAME v$CADIXMOD_VERSION..."

    DISCORD_PATH=$(find_discord_path) || {
        write_error "Discord not found. Please install Discord first."
        exit 1
    }

    write_status "Found Discord at: $DISCORD_PATH"

    RESOURCES_PATH="$DISCORD_PATH/resources"
    ASAR_PATH="$RESOURCES_PATH/app.asar"
    BACKUP_PATH="$RESOURCES_PATH/app.asar.backup"

    if [ ! -f "$ASAR_PATH" ]; then
        write_error "app.asar not found at: $ASAR_PATH"
        exit 1
    fi

    if [ -f "$BACKUP_PATH" ]; then
        write_status "Backup already exists, skipping..."
    else
        write_status "Creating backup of app.asar..."
        cp "$ASAR_PATH" "$BACKUP_PATH"
    fi

    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    DIST_PATH="$(dirname "$SCRIPT_DIR")/dist"

    if [ ! -d "$DIST_PATH" ]; then
        write_status "Building $CADIXMOD_NAME..."
        npm run build
    fi

    APP_DIR="$RESOURCES_PATH/app"
    mkdir -p "$APP_DIR"

    cat > "$APP_DIR/index.js" << 'EOF'
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
EOF

    cat > "$APP_DIR/package.json" << EOF
{
    "name": "cadixmod-discord",
    "version": "$CADIXMOD_VERSION",
    "main": "index.js"
}
EOF

    CADIXMOD_DIST="$RESOURCES_PATH/cadixmod"
    mkdir -p "$CADIXMOD_DIST"
    cp -r "$DIST_PATH"/* "$CADIXMOD_DIST/"

    write_success "$CADIXMOD_NAME installed successfully!"
    write_status "Please restart Discord to apply changes."
}

uninstall_cadixmod() {
    write_status "Uninstalling $CADIXMOD_NAME..."

    DISCORD_PATH=$(find_discord_path) || {
        write_error "Discord not found."
        exit 1
    }

    RESOURCES_PATH="$DISCORD_PATH/resources"
    BACKUP_PATH="$RESOURCES_PATH/app.asar.backup"
    ASAR_PATH="$RESOURCES_PATH/app.asar"
    APP_DIR="$RESOURCES_PATH/app"
    CADIXMOD_DIST="$RESOURCES_PATH/cadixmod"

    if [ -f "$BACKUP_PATH" ]; then
        rm -f "$ASAR_PATH"
        mv "$BACKUP_PATH" "$ASAR_PATH"
        write_success "Restored original app.asar"
    fi

    rm -rf "$APP_DIR"
    rm -rf "$CADIXMOD_DIST"

    write_success "$CADIXMOD_NAME uninstalled successfully!"
    write_status "Please restart Discord to apply changes."
}

case "${1:-install}" in
    install)
        install_cadixmod
        ;;
    uninstall)
        uninstall_cadixmod
        ;;
    *)
        echo "Usage: $0 {install|uninstall}"
        exit 1
        ;;
esac
