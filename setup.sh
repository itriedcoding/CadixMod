#!/bin/bash
# CadixMod Setup Script for Linux/macOS

echo ""
echo "============================================"
echo "  CadixMod - Discord Client Mod Setup"
echo "============================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[X] Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
echo "[*] Node.js $(node --version) found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "[X] npm not found"
    exit 1
fi
echo "[*] npm $(npm --version) found"

# Install root dependencies
echo ""
echo "[*] Installing root dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "[X] Failed to install root dependencies"
    exit 1
fi

# Install app dependencies
echo ""
echo "[*] Installing desktop app dependencies..."
cd app
npm install
cd ..
if [ $? -ne 0 ]; then
    echo "[X] Failed to install app dependencies"
    exit 1
fi

# Build mod
echo ""
echo "[*] Building mod..."
npm run build
if [ $? -ne 0 ]; then
    echo "[X] Failed to build mod"
    exit 1
fi

# Build desktop app
echo ""
echo "[*] Building desktop app..."
cd app
npm run build
cd ..
if [ $? -ne 0 ]; then
    echo "[X] Failed to build desktop app"
    exit 1
fi

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "To run the desktop app:"
echo "  cd app && npm run dev"
echo ""
echo "To build installers:"
echo "  cd app && npm run dist:win    # Windows"
echo "  cd app && npm run dist:linux  # Linux"
echo "  cd app && npm run dist:mac    # macOS"
echo ""
echo "To inject directly into Discord:"
echo "  node scripts/inject.mjs"
echo ""
