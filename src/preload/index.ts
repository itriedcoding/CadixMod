// CadixMod Preload Script
// Runs in the renderer context with access to Node.js APIs

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("CadixMod", {
  version: "1.0.0",
  platform: process.platform,

  settings: {
    get: () => ipcRenderer.invoke("cadixmod:getSettings"),
    set: (settings: Record<string, any>) => ipcRenderer.invoke("cadixmod:setSettings", settings),
  },

  plugins: {
    getAll: () => ipcRenderer.invoke("cadixmod:getPlugins"),
    toggle: (name: string, enabled: boolean) =>
      ipcRenderer.invoke("cadixmod:togglePlugin", name, enabled),
  },

  system: {
    restart: () => ipcRenderer.invoke("cadixmod:restart"),
    getPlatform: () => ipcRenderer.invoke("cadixmod:getPlatform"),
  },

  ipc: {
    send: (channel: string, data: any) => {
      const validChannels = [
        "cadixmod:main",
        "cadixmod:plugin",
        "cadixmod:log",
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    on: (channel: string, callback: (...args: any[]) => void) => {
      const validChannels = [
        "cadixmod:renderer",
        "cadixmod:plugin",
        "cadixmod:settings",
        "cadixmod:updater",
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (_, ...args) => callback(...args));
      }
    },
    invoke: (channel: string, ...args: any[]) => {
      return ipcRenderer.invoke(channel, ...args);
    },
  },
});

console.log("[CadixMod] Preload script loaded");
