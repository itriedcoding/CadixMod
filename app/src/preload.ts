const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  window: {
    minimize: () => ipcRenderer.invoke("app:minimize"),
    maximize: () => ipcRenderer.invoke("app:maximize"),
    close: () => ipcRenderer.invoke("app:close"),
    quit: () => ipcRenderer.invoke("app:quit"),
  },

  discord: {
    detect: () => ipcRenderer.invoke("discord:detect"),
    isRunning: () => ipcRenderer.invoke("discord:isRunning"),
    inject: (inst: any) => ipcRenderer.invoke("discord:inject", inst),
    uninject: (inst: any) => ipcRenderer.invoke("discord:uninject", inst),
    launch: (inst: any) => ipcRenderer.invoke("discord:launch", inst),
    kill: () => ipcRenderer.invoke("discord:kill"),
    isInjected: (inst: any) => ipcRenderer.invoke("discord:isInjected", inst),
    onStatus: (callback: Function) => ipcRenderer.on("discord:status", (_: any, data: any) => callback(data)),
  },

  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    set: (s: any) => ipcRenderer.invoke("settings:set", s),
  },

  autoinject: {
    run: () => ipcRenderer.invoke("autoinject:run"),
    remove: () => ipcRenderer.invoke("autoinject:remove"),
  },

  updater: {
    check: () => ipcRenderer.invoke("updater:check"),
  },
});
