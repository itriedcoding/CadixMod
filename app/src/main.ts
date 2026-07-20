import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from "electron";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { detectDiscord, isDiscordRunning, killDiscord, launchDiscord, type DiscordInstallation } from "./discord";
import { inject, uninject, isInjected } from "./injector";
import { logger } from "./logger";

const CADIXMOD_DIR = join(homedir(), ".cadixmod");
const SETTINGS_FILE = join(CADIXMOD_DIR, "settings.json");

interface AppSettings {
  autoInject: boolean;
  launchOnStartup: boolean;
  minimizeToTray: boolean;
  closeToTray: boolean;
  autoStartDiscord: boolean;
  selectedChannel: string;
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

function createTray(): void {
  try {
    const iconPath = join(getAppPath(), "assets", "icon.png");
    let trayIcon: Electron.NativeImage;
    if (existsSync(iconPath)) {
      trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    } else {
      trayIcon = nativeImage.createEmpty();
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
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 700,
    minHeight: 500,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#0d0d0d",
    icon: join(getAppPath(), "assets", "icon.png"),
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  mainWindow.loadFile(join(__dirname, "index.html"));

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
}

app.whenReady().then(async () => {
  settings = loadSettings();
  logger.info("CadixMod Desktop v1.0.0 starting...");

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
