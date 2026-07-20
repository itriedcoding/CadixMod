// CadixMod Plugins Index

import type { Plugin } from "../shared/types";
import { pluginManager } from "../api/plugin";

const plugins: Plugin[] = [];

export function registerAllPlugins(): void {
  for (const plugin of plugins) {
    pluginManager.register(plugin);
  }
}

export function addPlugin(plugin: Plugin): void {
  plugins.push(plugin);
}

export default plugins;
