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
    onStatus: (callback: Function) =>
      ipcRenderer.on("discord:status", (_: any, data: any) => callback(data)),
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

  plugins: {
    get: () => ipcRenderer.invoke("plugins:get"),
    enable: (name: string) => ipcRenderer.invoke("plugins:enable", name),
    disable: (name: string) => ipcRenderer.invoke("plugins:disable", name),
    getSettings: (name: string) => ipcRenderer.invoke("plugins:getSettings", name),
    setSettings: (name: string, data: any) =>
      ipcRenderer.invoke("plugins:setSettings", name, data),
    readDir: (name: string) => ipcRenderer.invoke("plugins:readDir", name),
    writeFile: (pluginName: string, filePath: string, content: string) =>
      ipcRenderer.invoke("plugins:writeFile", pluginName, filePath, content),
    readFile: (pluginName: string, filePath: string) =>
      ipcRenderer.invoke("plugins:readFile", pluginName, filePath),
  },

  themes: {
    get: () => ipcRenderer.invoke("themes:get"),
    install: (name: string, data: any) => ipcRenderer.invoke("themes:install", name, data),
    remove: (name: string) => ipcRenderer.invoke("themes:remove", name),
    readDir: () => ipcRenderer.invoke("themes:readDir"),
    writeFile: (fileName: string, content: string) =>
      ipcRenderer.invoke("themes:writeFile", fileName, content),
    deleteFile: (fileName: string) => ipcRenderer.invoke("themes:deleteFile", fileName),
  },
});
