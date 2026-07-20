// CadixMod Inject Script
// Installs CadixMod into Discord

import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { platform } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function getDiscordPath() {
  const platform_ = platform();

  const paths = {
    win32: [
      join(process.env.LOCALAPPDATA || "", "Discord"),
      join(process.env.APPDATA || "", "Discord"),
    ],
    linux: [
      join(process.env.HOME || "", ".config/discord"),
      join(process.env.HOME || "", ".local/share/Discord"),
      "/usr/lib/discord",
      "/opt/Discord",
    ],
    darwin: [
      "/Applications/Discord.app/Contents/Resources",
      join(process.env.HOME || "", "Library/Application Support/discord"),
    ],
  };

  for (const path of paths[platform_] || []) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

function copyDirSync(src, dest) {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function inject() {
  console.log("\x1b[36m[CadixMod]\x1b[0m Injecting into Discord...");

  const discordPath = getDiscordPath();
  if (!discordPath) {
    console.error("\x1b[31m[X]\x1b[0m Discord not found");
    process.exit(1);
  }

  console.log(`\x1b[32m[*]\x1b[0m Found Discord at: ${discordPath}`);

  const resourcesPath = join(discordPath, "resources");
  const asarPath = join(resourcesPath, "app.asar");
  const backupPath = join(resourcesPath, "app.asar.backup");
  const appDir = join(resourcesPath, "app");
  const cadixmodDir = join(resourcesPath, "cadixmod");

  if (!existsSync(asarPath)) {
    console.error("\x1b[31m[X]\x1b[0m app.asar not found");
    process.exit(1);
  }

  if (!existsSync(backupPath)) {
    console.log("\x1b[36m[CadixMod]\x1b[0m Creating backup...");
    copyFileSync(asarPath, backupPath);
  }

  mkdirSync(appDir, { recursive: true });

  const indexContent = `
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
`;

  const packageContent = JSON.stringify({
    name: "cadixmod-discord",
    version: "1.1.0",
    main: "index.js",
  }, null, 2);

  writeFileSync(join(appDir, "index.js"), indexContent);
  writeFileSync(join(appDir, "package.json"), packageContent);

  const distPath = join(ROOT, "dist");
  if (!existsSync(distPath)) {
    console.error("\x1b[31m[X]\x1b[0m dist/ not found. Run 'npm run build' first.");
    process.exit(1);
  }

  console.log("\x1b[36m[CadixMod]\x1b[0m Copying files...");
  copyDirSync(distPath, cadixmodDir);

  console.log("\x1b[32m[*]\x1b[0m CadixMod injected successfully!");
  console.log("\x1b[36m[CadixMod]\x1b[0m Please restart Discord.");
}

inject();
