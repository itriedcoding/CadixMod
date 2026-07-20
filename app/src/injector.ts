import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync, readdirSync } from "fs";
import { join } from "path";
import type { DiscordInstallation } from "./discord";
import { logger } from "./logger";

const CADIXMOD_CORE = join(__dirname, "..", "mod");

function getModFiles(): string[] {
  if (!existsSync(CADIXMOD_CORE)) {
    logger.warn("Mod core not found, skipping file copy");
    return [];
  }

  const files: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = require("fs").statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else {
        files.push(full);
      }
    }
  }
  walk(CADIXMOD_CORE);
  return files;
}

export function inject(installation: DiscordInstallation): { success: boolean; message: string } {
  try {
    logger.info(`Injecting into ${installation.name} (${installation.channel})...`);

    const { resourcesPath, asarPath } = installation;
    const backupPath = join(resourcesPath, "app.asar.backup");

    if (!existsSync(asarPath)) {
      return { success: false, message: "app.asar not found" };
    }

    if (!existsSync(backupPath)) {
      logger.info("Creating backup of app.asar...");
      cpSync(asarPath, backupPath);
    }

    const appDir = join(resourcesPath, "app");
    mkdirSync(appDir, { recursive: true });

    const indexContent = `"use strict";
const { app, BrowserWindow, session, ipcMain } = require("electron");
const { join, dirname } = require("path");
const { existsSync, readFileSync } = require("fs");

const RESOURCES_DIR = dirname(__dirname);
const ASAR_BACKUP = join(RESOURCES_DIR, "app.asar.backup");
const CADIXMOD_DIR = join(RESOURCES_DIR, "cadixmod");
const CADIXMOD_MAIN = join(CADIXMOD_DIR, "main.js");

let cadixmodLoaded = false;

function loadCadixMod() {
  if (cadixmodLoaded) return;
  try {
    if (existsSync(CADIXMOD_MAIN)) {
      require(CADIXMOD_MAIN);
      cadixmodLoaded = true;
      console.log("[CadixMod] Loaded successfully");
    }
  } catch (err) {
    console.error("[CadixMod] Failed to load:", err.message);
  }
}

loadCadixMod();

if (existsSync(ASAR_BACKUP)) {
  try {
    const originalApp = require(ASAR_BACKUP);
    if (typeof originalApp === "function") {
      module.exports = originalApp;
    }
  } catch (err) {
    console.error("[CadixMod] Failed to load original Discord:", err.message);
  }
}
`;

    const packageJsonContent = JSON.stringify({
      name: "cadixmod-discord",
      version: "1.0.0",
      main: "index.js",
    }, null, 2);

    writeFileSync(join(appDir, "index.js"), indexContent);
    writeFileSync(join(appDir, "package.json"), packageJsonContent);

    const cadixmodDist = join(resourcesPath, "cadixmod");
    mkdirSync(cadixmodDist, { recursive: true });

    if (existsSync(CADIXMOD_CORE)) {
      cpSync(CADIXMOD_CORE, cadixmodDist, { recursive: true });
    }

    logger.info(`Injected successfully into ${installation.name}`);
    return { success: true, message: `Successfully injected into ${installation.name}` };
  } catch (err: any) {
    logger.error(`Injection failed: ${err.message}`);
    return { success: false, message: err.message };
  }
}

export function uninject(installation: DiscordInstallation): { success: boolean; message: string } {
  try {
    logger.info(`Removing from ${installation.name}...`);

    const { resourcesPath, asarPath } = installation;
    const backupPath = join(resourcesPath, "app.asar.backup");
    const appDir = join(resourcesPath, "app");
    const cadixmodDist = join(resourcesPath, "cadixmod");

    if (existsSync(backupPath)) {
      if (existsSync(asarPath)) {
        rmSync(asarPath, { recursive: true, force: true });
      }
      const { renameSync } = require("fs");
      renameSync(backupPath, asarPath);
      logger.info("Restored original app.asar");
    }

    if (existsSync(appDir)) {
      rmSync(appDir, { recursive: true, force: true });
    }

    if (existsSync(cadixmodDist)) {
      rmSync(cadixmodDist, { recursive: true, force: true });
    }

    logger.info(`Removed from ${installation.name}`);
    return { success: true, message: `Successfully removed from ${installation.name}` };
  } catch (err: any) {
    logger.error(`Uninject failed: ${err.message}`);
    return { success: false, message: err.message };
  }
}

export function isInjected(installation: DiscordInstallation): boolean {
  const backupPath = join(installation.resourcesPath, "app.asar.backup");
  const appDir = join(installation.resourcesPath, "app");
  return existsSync(backupPath) && existsSync(appDir);
}
