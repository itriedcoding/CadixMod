# CadixMod

A high-performance, cross-platform Discord client mod with a standalone desktop app for easy injection management.

![CadixMod](https://img.shields.io/badge/version-1.0.0-blue) ![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-green) ![License](https://img.shields.io/badge/license-MIT-yellow)

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

1. Download the latest release from [Releases](https://github.com/itriedcoding/CadixMod/releases)
2. Run the installer for your platform:
   - **Windows**: `CadixMod-Setup-1.0.0.exe`
   - **macOS**: `CadixMod-1.0.0.dmg`
   - **Linux**: `CadixMod-1.0.0.AppImage`
3. Open CadixMod and click "Inject into Discord"
4. Launch Discord - CadixMod is now active!

### Build from Source

```bash
# Clone the repository
git clone https://github.com/itriedcoding/CadixMod.git
cd CadixMod

# Install dependencies
npm install

# Build everything (mod + desktop app)
npm run build:all

# Or build just the mod
npm run build

# Or build just the desktop app
npm run build:desktop
```

### Run Desktop App in Development

```bash
npm run desktop
```

## Building Installers

```bash
# Build for your current platform
npm run desktop:build

# Build for specific platforms
npm run desktop:build:win     # Windows (.exe installer + portable)
npm run desktop:build:linux   # Linux (.AppImage + .deb)
npm run desktop:build:mac     # macOS (.dmg)
```

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
│   ├── build.mjs          # Mod build
│   ├── build-mod.mjs      # Mod build for desktop app
│   ├── inject.mjs         # CLI injection
│   ├── uninject.mjs       # CLI removal
│   ├── install.ps1        # Windows installer
│   ├── install.sh         # Linux installer
│   └── install_macos.sh   # macOS installer
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
```bash
# Windows
.\scripts\install.ps1 uninstall

# Linux
./scripts/install.sh uninstall

# macOS
./scripts/install_macos.sh uninstall
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
