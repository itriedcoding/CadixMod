# CadixMod

A high-performance, cross-platform Discord client mod with a standalone desktop app for easy injection management.

![CadixMod](https://img.shields.io/badge/version-1.0.0-blue) ![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-green) ![License](https://img.shields.io/badge/license-MIT-yellow)

## Downloads

Grab the latest release from [**GitHub Releases**](https://github.com/itriedcoding/CadixMod/releases/latest)

| Platform | File | Description |
|----------|------|-------------|
| Windows | `CadixMod-Setup-1.0.0.exe` | Installer with Start Menu shortcut |
| Windows | `CadixMod-1.0.0.exe` | Portable (no install needed) |
| Linux | `CadixMod-1.0.0.AppImage` | Portable, works on most distros |
| Linux | `cadixmod_1.0.0_amd64.deb` | Debian/Ubuntu package |
| macOS | `CadixMod-1.0.0.dmg` | macOS disk image |

## Features

- **Desktop App** - Standalone GUI for managing Discord injection
- **One-Click Inject** - Inject into Discord with a single click
- **Auto-Detection** - Automatically finds all Discord installations (Stable, PTB, Canary)
- **Zero Overhead** - No lag, no performance impact on Discord
- **Plugin System** - Hot-reloadable plugins with full API access
- **Custom Themes** - CSS injection for complete visual customization
- **Runtime Patching** - Modify Discord's behavior on the fly
- **System Tray** - Runs in the background, minimizes to tray
- **Cross-Platform** - Windows, Linux, and macOS support
- **Safe & Reversible** - Full backup and one-click uninstall

## Quick Start

### Desktop App (Recommended)

1. Download the latest release for your platform from [Releases](https://github.com/itriedcoding/CadixMod/releases/latest)
2. Run the installer or portable executable
3. Open CadixMod and click **"Inject into Discord"**
4. Launch Discord - CadixMod is now active!

### Build from Source

#### Windows (PowerShell)
```powershell
git clone https://github.com/itriedcoding/CadixMod.git
cd CadixMod
.\setup.ps1
```

#### Linux / macOS
```bash
git clone https://github.com/itriedcoding/CadixMod.git
cd CadixMod
chmod +x setup.sh
./setup.sh
```

#### Run the Desktop App
```powershell
cd app
npm run dev
```

### Build Installers

#### Windows
```powershell
cd app
npm install
npm run dist:win
```

#### Linux
```bash
cd app
npm install
npm run dist:linux
```

#### macOS
```bash
cd app
npm install
npm run dist:mac
```

Built installers will be in `app/release/`.

## Project Structure

```
CadixMod/
├── src/                    # Discord mod source code
│   ├── main/              # Mod main process (injected into Discord)
│   ├── renderer/          # Mod renderer (UI injection)
│   ├── preload/           # Mod preload bridge
│   ├── shared/            # Shared types and constants
│   ├── api/               # Core APIs (plugin, patcher, discord)
│   ├── plugins/           # Built-in plugins
│   └── utils/             # Utilities (logger, storage)
├── app/                   # Desktop Electron app
│   ├── src/
│   │   ├── main.ts        # Electron main process
│   │   ├── preload.ts     # Electron preload
│   │   ├── renderer.ts    # GUI logic
│   │   ├── discord.ts     # Discord detection
│   │   ├── injector.ts    # Injection engine
│   │   └── logger.ts      # Logging
│   ├── index.html         # GUI window
│   ├── package.json       # Desktop app dependencies
│   └── build.mjs          # Build script
├── scripts/               # Build and install scripts
├── .github/workflows/     # GitHub Actions (auto-release)
├── setup.ps1              # Windows setup script
├── setup.sh               # Linux/macOS setup script
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

1. **Desktop App** detects Discord installations on your system
2. Click **Inject** to patch Discord
3. The app creates a backup of Discord's `app.asar`
4. It installs a loader that loads CadixMod when Discord starts
5. CadixMod's renderer injects into Discord's web content
6. Plugins, themes, and patches are applied at runtime

## Writing Plugins

Create a new file in `src/plugins/`:

```typescript
import type { Plugin } from "../shared/types";
import { logger } from "../utils/logger";

const plugin: Plugin = {
  name: "MyPlugin",
  description: "My awesome plugin",
  version: "1.0.0",
  author: "Your Name",
  tags: ["utility"],

  start() {
    logger.debug("MyPlugin started");
    // Your plugin code here
  },

  stop() {
    logger.debug("MyPlugin stopped");
    // Cleanup code here
  },
};

export default plugin;
```

## API Reference

### Plugin API
```typescript
import { pluginManager } from "../api/plugin";
pluginManager.register(myPlugin);
pluginManager.enable("PluginName");
pluginManager.disable("PluginName");
```

### Patcher API
```typescript
import { patcher } from "../api/patcher";
patcher.before("Module", "method", (args) => args);
patcher.after("Module", "method", (args, ret) => ret);
patcher.instead("Module", "method", (args, orig) => orig(...args));
```

### Discord API
```typescript
import { discordAPI } from "../api/discord";
const user = discordAPI.getCurrentUser();
discordAPI.sendMessage(channelId, "Hello!");
```

## Uninstallation

### Via Desktop App
Open CadixMod -> Discord -> Click "Remove" on each installation

### Via CLI
```powershell
# Windows
node scripts/uninject.mjs
```
```bash
# Linux / macOS
node scripts/uninject.mjs
```

### Manual
1. Close Discord
2. Navigate to Discord's `resources` folder
3. Delete the `app` folder
4. Rename `app.asar.backup` to `app.asar`
5. Delete the `cadixmod` folder

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details

## Disclaimer

CadixMod is not affiliated with Discord. Use at your own risk. Discord's Terms of Service may prohibit client modifications.
