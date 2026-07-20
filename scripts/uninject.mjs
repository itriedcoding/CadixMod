// CadixMod Uninject Script
// Removes CadixMod from Discord installation

import { existsSync, rmSync, renameSync } from "fs";
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

function uninject() {
  console.log("\x1b[36m[CadixMod]\x1b[0m Removing from Discord...");

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

  if (existsSync(backupPath)) {
    if (existsSync(asarPath)) {
      rmSync(asarPath, { recursive: true, force: true });
    }
    renameSync(backupPath, asarPath);
    console.log("\x1b[32m[*]\x1b[0m Restored original app.asar");
  }

  if (existsSync(appDir)) {
    rmSync(appDir, { recursive: true, force: true });
    console.log("\x1b[32m[*]\x1b[0m Removed app directory");
  }

  if (existsSync(cadixmodDir)) {
    rmSync(cadixmodDir, { recursive: true, force: true });
    console.log("\x1b[32m[*]\x1b[0m Removed CadixMod files");
  }

  console.log("\x1b[32m[*]\x1b[0m CadixMod removed successfully!");
  console.log("\x1b[36m[CadixMod]\x1b[0m Please restart Discord.");
}

uninject();
