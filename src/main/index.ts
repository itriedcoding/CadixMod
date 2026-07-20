// CadixMod Main Process Entry
import { app, BrowserWindow, ipcMain, session } from "electron";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir, platform } from "os";

const CADIXMOD_DIR = join(homedir(), ".cadixmod");
const SETTINGS_FILE = join(CADIXMOD_DIR, "settings.json");
const PLUGINS_DIR = join(CADIXMOD_DIR, "plugins");
const THEMES_DIR = join(CADIXMOD_DIR, "themes");

class CadixMod {
  private static instance: CadixMod;
  private settings: Record<string, any> = {};
  private plugins: Map<string, any> = new Map();

  static getInstance(): CadixMod {
    if (!CadixMod.instance) {
      CadixMod.instance = new CadixMod();
    }
    return CadixMod.instance;
  }

  async initialize(): Promise<void> {
    console.log("[CadixMod] Initializing...");
    this.ensureDirectories();
    this.loadSettings();
    this.setupIPC();
    this.setupWindowInterceptor();
    console.log("[CadixMod] Initialized successfully");
  }

  private ensureDirectories(): void {
    const dirs = [CADIXMOD_DIR, PLUGINS_DIR, THEMES_DIR];
    for (const dir of dirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
  }

  private loadSettings(): void {
    try {
      if (existsSync(SETTINGS_FILE)) {
        this.settings = JSON.parse(readFileSync(SETTINGS_FILE, "utf-8"));
      } else {
        this.settings = {
          enabled: true,
          plugins: {},
          theme: "default",
          customCSS: "",
          developerMode: false,
          autoUpdate: true,
        };
        this.saveSettings();
      }
    } catch (err) {
      console.error("[CadixMod] Failed to load settings:", err);
      this.settings = {};
    }
  }

  saveSettings(): void {
    try {
      writeFileSync(SETTINGS_FILE, JSON.stringify(this.settings, null, 2));
    } catch (err) {
      console.error("[CadixMod] Failed to save settings:", err);
    }
  }

  private setupIPC(): void {
    ipcMain.handle("cadixmod:getSettings", () => this.settings);
    ipcMain.handle("cadixmod:setSettings", (_, settings) => {
      this.settings = { ...this.settings, ...settings };
      this.saveSettings();
      return this.settings;
    });

    ipcMain.handle("cadixmod:getPlugins", () => {
      return Array.from(this.plugins.keys());
    });

    ipcMain.handle("cadixmod:togglePlugin", (_, name, enabled) => {
      if (this.plugins.has(name)) {
        const plugin = this.plugins.get(name);
        if (enabled) {
          plugin.start?.();
        } else {
          plugin.stop?.();
        }
      }
    });

    ipcMain.handle("cadixmod:getPlatform", () => platform());

    ipcMain.handle("cadixmod:restart", () => {
      app.relaunch();
      app.exit(0);
    });
  }

  private setupWindowInterceptor(): void {
    const originalOnReady = app.on;

    app.on("browser-window-created", (_, window) => {
      this.injectRenderer(window);
    });

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      if (details.url.includes("discord.com") && details.url.includes("/api")) {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            "Access-Control-Allow-Origin": ["*"],
          },
        });
      } else {
        callback({ responseHeaders: details.responseHeaders });
      }
    });
  }

  private async injectRenderer(window: BrowserWindow): Promise<void> {
    const url = window.webContents.getURL();

    if (url.includes("discord.com") || url.includes("discordapp.com")) {
      window.webContents.on("did-finish-load", () => {
        window.webContents.executeJavaScript(`
          if (!window.__CADIXMOD_INJECTED__) {
            window.__CADIXMOD_INJECTED__ = true;
            const script = document.createElement('script');
            script.src = 'file:///${join(__dirname, "..", "renderer", "index.js").replace(/\\/g, "/")}";
            document.head.appendChild(script);
          }
        `);
      });
    }
  }
}

app.whenReady().then(async () => {
  await CadixMod.getInstance().initialize();
});

app.on("window-all-closed", () => {
  if (platform() !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    app.quit();
  }
});
