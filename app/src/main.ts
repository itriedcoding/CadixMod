import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from "electron";
import { join } from "path";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  rmSync,
  unlinkSync,
  statSync,
} from "fs";
import { homedir } from "os";
import {
  detectDiscord,
  isDiscordRunning,
  killDiscord,
  launchDiscord,
  type DiscordInstallation,
} from "./discord";
import { inject, uninject, isInjected } from "./injector";
import { logger } from "./logger";

const CADIXMOD_DIR = join(homedir(), ".cadixmod");
const SETTINGS_FILE = join(CADIXMOD_DIR, "settings.json");
const PLUGINS_DIR = join(CADIXMOD_DIR, "plugins");
const THEMES_DIR = join(CADIXMOD_DIR, "themes");
const PLUGIN_SETTINGS_DIR = join(CADIXMOD_DIR, "plugin-settings");

interface AppSettings {
  autoInject: boolean;
  launchOnStartup: boolean;
  minimizeToTray: boolean;
  closeToTray: boolean;
  autoStartDiscord: boolean;
  selectedChannel: string;
}

interface PluginMeta {
  name: string;
  description: string;
  version: string;
  author: string;
  enabled: boolean;
  main: string;
}

interface ThemeMeta {
  name: string;
  author: string;
  description: string;
  enabled: boolean;
  colors: Record<string, string>;
  css: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  autoInject: true,
  launchOnStartup: false,
  minimizeToTray: true,
  closeToTray: true,
  autoStartDiscord: false,
  selectedChannel: "stable",
};

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let settings: AppSettings = DEFAULT_SETTINGS;
let discordWatcher: NodeJS.Timeout | null = null;

function getAppPath(): string {
  return app.isPackaged ? process.resourcesPath : join(__dirname, "..");
}

function loadSettings(): AppSettings {
  try {
    mkdirSync(CADIXMOD_DIR, { recursive: true });
    if (existsSync(SETTINGS_FILE)) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(readFileSync(SETTINGS_FILE, "utf-8")) };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s: AppSettings): void {
  try {
    mkdirSync(CADIXMOD_DIR, { recursive: true });
    writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2));
  } catch {}
}

function ensureDirs(): void {
  mkdirSync(PLUGINS_DIR, { recursive: true });
  mkdirSync(THEMES_DIR, { recursive: true });
  mkdirSync(PLUGIN_SETTINGS_DIR, { recursive: true });
}

function parsePluginDir(dirPath: string): PluginMeta | null {
  try {
    const manifestPath = join(dirPath, "manifest.json");
    if (!existsSync(manifestPath)) {
      const jsFiles = readdirSync(dirPath).filter((f) => f.endsWith(".js"));
      if (jsFiles.length === 0) return null;
      const name = require("path").basename(dirPath);
      return {
        name,
        description: "No manifest found",
        version: "1.0.0",
        author: "Unknown",
        enabled: false,
        main: jsFiles[0],
      };
    }
    const raw = JSON.parse(readFileSync(manifestPath, "utf-8"));
    return {
      name: raw.name || require("path").basename(dirPath),
      description: raw.description || "",
      version: raw.version || "1.0.0",
      author: raw.author || "Unknown",
      enabled: raw.enabled !== undefined ? raw.enabled : false,
      main: raw.main || "index.js",
    };
  } catch {
    return null;
  }
}

function parseThemeFile(filePath: string): ThemeMeta | null {
  try {
    const raw = JSON.parse(readFileSync(filePath, "utf-8"));
    return {
      name: raw.name || require("path").basename(filePath, ".json"),
      author: raw.author || "Unknown",
      description: raw.description || "",
      enabled: raw.enabled !== undefined ? raw.enabled : false,
      colors: raw.colors || {},
      css: raw.css || "",
    };
  } catch {
    return null;
  }
}

function readPluginSettings(pluginName: string): Record<string, any> {
  try {
    const settingsPath = join(PLUGIN_SETTINGS_DIR, `${pluginName}.json`);
    if (existsSync(settingsPath)) {
      return JSON.parse(readFileSync(settingsPath, "utf-8"));
    }
  } catch {}
  return {};
}

function writePluginSettings(pluginName: string, data: Record<string, any>): void {
  try {
    mkdirSync(PLUGIN_SETTINGS_DIR, { recursive: true });
    const settingsPath = join(PLUGIN_SETTINGS_DIR, `${pluginName}.json`);
    writeFileSync(settingsPath, JSON.stringify(data, null, 2));
  } catch {}
}

function createTray(): void {
  try {
    const iconPath = join(getAppPath(), "assets", "icon.png");
    let trayIcon: Electron.NativeImage;
    if (existsSync(iconPath)) {
      trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    } else {
      trayIcon = nativeImage.createColoredImage("#5865F2").resize({ width: 16, height: 16 });
    }
    tray = new Tray(trayIcon);
  } catch {
    tray = new Tray(nativeImage.createEmpty());
  }

  tray.setToolTip("CadixMod");

  const contextMenu = Menu.buildFromTemplate([
    { label: "Show CadixMod", click: () => mainWindow?.show() },
    { type: "separator" },
    { label: "Inject into Discord", click: () => autoInjectAll() },
    { label: "Remove from Discord", click: () => uninjectAll() },
    { type: "separator" },
    {
      label: "Launch Discord",
      click: () => {
        const installs = detectDiscord();
        if (installs.length > 0) launchDiscord(installs[0]);
      },
    },
    { label: "Kill Discord", click: () => killDiscord() },
    { type: "separator" },
    {
      label: "Exit",
      click: () => {
        settings.closeToTray = false;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => mainWindow?.show());
}

function createWindow(): void {
  const iconPath = join(getAppPath(), "assets", "icon.png");
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 900,
    height: 600,
    minWidth: 700,
    minHeight: 500,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#0a0a0a",
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  };

  if (existsSync(iconPath)) {
    windowOptions.icon = nativeImage.createFromPath(iconPath);
  }

  mainWindow = new BrowserWindow(windowOptions);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return { action: "deny" };
  });

  mainWindow.on("aura:ready", () => {
    const win = mainWindow;
    if (win) {
      win.show();
    }
  });

  mainWindow.loadFile(join(__dirname, "index.html"));

  mainWindow.webContents.on("did-fail-to-load", (event, errorCode, errorName, errorDesc) => {
    logger.error(`Failed to load index.html: ${errorDesc} (${errorName}: ${errorCode})`);
  });

  mainWindow.webContents.on("crashed", (event, killed) => {
    logger.error(`Renderer crashed. Killed: ${killed}`);
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("close", (e) => {
    if (settings.closeToTray) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function autoInjectAll(): void {
  const installs = detectDiscord();
  for (const inst of installs) {
    if (!isInjected(inst)) {
      inject(inst);
    }
  }
}

function uninjectAll(): void {
  const installs = detectDiscord();
  for (const inst of installs) {
    if (isInjected(inst)) {
      uninject(inst);
    }
  }
}

function startDiscordWatcher(): void {
  if (discordWatcher) clearInterval(discordWatcher);

  discordWatcher = setInterval(() => {
    try {
      const installs = detectDiscord();
      mainWindow?.webContents.send("discord:status", {
        running: isDiscordRunning(),
        installations: installs,
      });
    } catch {}
  }, 3000);
}

function setupIPC(): void {
  ipcMain.handle("app:minimize", () => mainWindow?.minimize());
  ipcMain.handle("app:maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.handle("app:close", () => mainWindow?.close());
  ipcMain.handle("app:quit", () => app.quit());

  ipcMain.handle("discord:detect", () => detectDiscord());
  ipcMain.handle("discord:isRunning", () => isDiscordRunning());
  ipcMain.handle("discord:inject", (_, inst: DiscordInstallation) => {
    const wasRunning = isDiscordRunning();
    if (wasRunning) killDiscord();
    const result = inject(inst);
    if (settings.autoStartDiscord) {
      setTimeout(() => launchDiscord(inst), 1000);
    }
    return result;
  });
  ipcMain.handle("discord:uninject", (_, inst: DiscordInstallation) => {
    const wasRunning = isDiscordRunning();
    if (wasRunning) killDiscord();
    const result = uninject(inst);
    if (settings.autoStartDiscord) {
      setTimeout(() => launchDiscord(inst), 1000);
    }
    return result;
  });
  ipcMain.handle("discord:launch", (_, inst: DiscordInstallation) => launchDiscord(inst));
  ipcMain.handle("discord:kill", () => killDiscord());
  ipcMain.handle("discord:isInjected", (_, inst: DiscordInstallation) => isInjected(inst));

  ipcMain.handle("settings:get", () => settings);
  ipcMain.handle("settings:set", (_, newSettings: Partial<AppSettings>) => {
    settings = { ...settings, ...newSettings };
    saveSettings(settings);
    return settings;
  });

  ipcMain.handle("autoinject:run", () => autoInjectAll());
  ipcMain.handle("autoinject:remove", () => uninjectAll());

  ipcMain.handle("updater:check", async () => {
    return { updateAvailable: false, version: "1.0.0" };
  });

  ipcMain.handle("plugins:get", () => {
    ensureDirs();
    const entries = readdirSync(PLUGINS_DIR, { withFileTypes: true });
    const plugins: PluginMeta[] = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const meta = parsePluginDir(join(PLUGINS_DIR, entry.name));
        if (meta) plugins.push(meta);
      }
    }
    return plugins;
  });

  ipcMain.handle("plugins:enable", (_, name: string) => {
    ensureDirs();
    const pluginDir = join(PLUGINS_DIR, name);
    const manifestPath = join(pluginDir, "manifest.json");
    if (existsSync(manifestPath)) {
      const raw = JSON.parse(readFileSync(manifestPath, "utf-8"));
      raw.enabled = true;
      writeFileSync(manifestPath, JSON.stringify(raw, null, 2));
    }
    logger.info(`Plugin enabled: ${name}`);
    return { success: true };
  });

  ipcMain.handle("plugins:disable", (_, name: string) => {
    ensureDirs();
    const pluginDir = join(PLUGINS_DIR, name);
    const manifestPath = join(pluginDir, "manifest.json");
    if (existsSync(manifestPath)) {
      const raw = JSON.parse(readFileSync(manifestPath, "utf-8"));
      raw.enabled = false;
      writeFileSync(manifestPath, JSON.stringify(raw, null, 2));
    }
    logger.info(`Plugin disabled: ${name}`);
    return { success: true };
  });

  ipcMain.handle("plugins:getSettings", (_, name: string) => {
    return readPluginSettings(name);
  });

  ipcMain.handle("plugins:setSettings", (_, name: string, data: Record<string, any>) => {
    writePluginSettings(name, data);
    return { success: true };
  });

  ipcMain.handle("plugins:readDir", (_, name: string) => {
    ensureDirs();
    const dirPath = join(PLUGINS_DIR, name);
    if (!existsSync(dirPath)) return { success: false, files: [] };
    const files: string[] = [];
    function walk(dir: string, prefix: string) {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const rel = prefix ? `${prefix}/${entry}` : entry;
        if (statSync(full).isDirectory()) {
          walk(full, rel);
        } else {
          files.push(rel);
        }
      }
    }
    walk(dirPath, "");
    return { success: true, files };
  });

  ipcMain.handle("plugins:writeFile", (_, pluginName: string, filePath: string, content: string) => {
    ensureDirs();
    const fullPath = join(PLUGINS_DIR, pluginName, filePath);
    const dir = require("path").dirname(fullPath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(fullPath, content, "utf-8");
    return { success: true };
  });

  ipcMain.handle("plugins:readFile", (_, pluginName: string, filePath: string) => {
    const fullPath = join(PLUGINS_DIR, pluginName, filePath);
    if (!existsSync(fullPath)) return { success: false, content: "" };
    const content = readFileSync(fullPath, "utf-8");
    return { success: true, content };
  });

  ipcMain.handle("themes:get", () => {
    ensureDirs();
    const files = readdirSync(THEMES_DIR).filter((f) => f.endsWith(".json"));
    const themes: ThemeMeta[] = [];
    for (const file of files) {
      const meta = parseThemeFile(join(THEMES_DIR, file));
      if (meta) themes.push(meta);
    }
    return themes;
  });

  ipcMain.handle("themes:install", (_, name: string, themeData: Partial<ThemeMeta>) => {
    ensureDirs();
    const themePath = join(THEMES_DIR, `${name}.json`);
    const existing = existsSync(themePath)
      ? JSON.parse(readFileSync(themePath, "utf-8"))
      : {};
    const merged = {
      name: name,
      author: themeData.author || existing.author || "Unknown",
      description: themeData.description || existing.description || "",
      enabled: themeData.enabled !== undefined ? themeData.enabled : existing.enabled || false,
      colors: themeData.colors || existing.colors || {},
      css: themeData.css !== undefined ? themeData.css : existing.css || "",
    };
    writeFileSync(themePath, JSON.stringify(merged, null, 2));
    logger.info(`Theme installed: ${name}`);
    return { success: true };
  });

  ipcMain.handle("themes:remove", (_, name: string) => {
    ensureDirs();
    const themePath = join(THEMES_DIR, `${name}.json`);
    if (existsSync(themePath)) {
      unlinkSync(themePath);
      logger.info(`Theme removed: ${name}`);
    }
    return { success: true };
  });

  ipcMain.handle("themes:readDir", () => {
    ensureDirs();
    const files = readdirSync(THEMES_DIR).filter((f) => f.endsWith(".json"));
    return { success: true, files };
  });

  ipcMain.handle("themes:writeFile", (_, fileName: string, content: string) => {
    ensureDirs();
    const filePath = join(THEMES_DIR, fileName);
    writeFileSync(filePath, content, "utf-8");
    return { success: true };
  });

  ipcMain.handle("themes:deleteFile", (_, fileName: string) => {
    ensureDirs();
    const filePath = join(THEMES_DIR, fileName);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
    return { success: true };
  });
}

app.whenReady().then(async () => {
  settings = loadSettings();
  ensureDirs();
  logger.info("CadixMod Desktop v1.1.0 starting...");

  createWindow();
  createTray();
  setupIPC();
  startDiscordWatcher();

  if (settings.autoInject) {
    logger.info("Auto-inject enabled, checking Discord...");
    setTimeout(() => autoInjectAll(), 2000);
  }

  app.setLoginItemSettings({
    openAtLogin: settings.launchOnStartup,
    name: "CadixMod",
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (!settings.closeToTray) {
      app.quit();
    }
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  if (discordWatcher) clearInterval(discordWatcher);
});
