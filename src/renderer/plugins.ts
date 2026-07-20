import { createLogger } from "../utils/logger";
import { Plugin, PluginSettings } from "../shared/types";
import { PluginStorage, SettingsStorage } from "../utils/storage";
import { Patcher } from "./patcher";
import { CADIXMOD_VERSION } from "../shared/constants";

const log = createLogger("Plugins", "#23A55A");

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private enabled = true;
  private loadOrder: string[] = [];

  init(): void {
    this.enabled = SettingsStorage.getGeneral("enablePlugins");
    log.info("Plugin manager initialized");
  }

  register(plugin: Plugin): boolean {
    if (this.plugins.has(plugin.id)) {
      log.warn(`Plugin "${plugin.name}" is already registered`);
      return false;
    }

    this.plugins.set(plugin.id, plugin);
    this.loadOrder.push(plugin.id);
    this.loadOrder.sort((a, b) => {
      const pa = this.plugins.get(a);
      const pb = this.plugins.get(b);
      const orderA = PluginStorage.get(a)?.order ?? 0;
      const orderB = PluginStorage.get(b)?.order ?? 0;
      return orderA - orderB;
    });

    const storageData = PluginStorage.get(plugin.id);
    if (!storageData) {
      PluginStorage.set(plugin.id, {
        enabled: true,
        order: this.loadOrder.indexOf(plugin.id),
        config: plugin.settings ?? {},
      });
    }

    log.info(`Registered plugin: ${plugin.name} v${plugin.version}`);

    if (this.isEnabled(plugin.id) && this.enabled) {
      this.startPlugin(plugin);
    }

    return true;
  }

  unregister(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      log.warn(`Plugin ${pluginId} not found`);
      return false;
    }

    if (this.isRunning(pluginId)) {
      this.stopPlugin(plugin);
    }

    Patcher.unpatchAll(pluginId);
    this.plugins.delete(pluginId);
    this.loadOrder = this.loadOrder.filter((id) => id !== pluginId);
    PluginStorage.remove(pluginId);

    log.info(`Unregistered plugin: ${plugin.name}`);
    return true;
  }

  enable(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      log.warn(`Plugin ${pluginId} not found`);
      return false;
    }

    if (!this.enabled) {
      log.warn("Plugin system is disabled");
      return false;
    }

    PluginStorage.setEnabled(pluginId, true);
    this.startPlugin(plugin);
    log.info(`Enabled plugin: ${plugin.name}`);
    return true;
  }

  disable(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      log.warn(`Plugin ${pluginId} not found`);
      return false;
    }

    PluginStorage.setEnabled(pluginId, false);
    this.stopPlugin(plugin);
    Patcher.unpatchAll(pluginId);
    log.info(`Disabled plugin: ${plugin.name}`);
    return true;
  }

  toggle(pluginId: string): boolean {
    return this.isEnabled(pluginId) ? this.disable(pluginId) : this.enable(pluginId);
  }

  private startPlugin(plugin: Plugin): void {
    try {
      this.applyPluginPatches(plugin);
      plugin.start();
      log.debug(`Started plugin: ${plugin.name}`);
    } catch (err) {
      log.error(`Failed to start plugin ${plugin.name}:`, err);
    }
  }

  private stopPlugin(plugin: Plugin): void {
    try {
      plugin.stop();
      log.debug(`Stopped plugin: ${plugin.name}`);
    } catch (err) {
      log.error(`Failed to stop plugin ${plugin.name}:`, err);
    }
  }

  private applyPluginPatches(plugin: Plugin): void {
    if (!plugin.patches || plugin.patches.length === 0) return;

    for (const patchDef of plugin.patches) {
      const module = this.resolveModule(patchDef.module);
      if (!module) {
        log.warn(`Module "${patchDef.module}" not found for plugin ${plugin.name}`);
        continue;
      }

      const target = this.getModuleTarget(module, patchDef.methodName);
      if (!target) {
        log.warn(`Method "${patchDef.methodName}" not found in module "${patchDef.module}"`);
        continue;
      }

      const patch = Patcher.createPatch(
        plugin.id,
        patchDef.module,
        patchDef.methodName,
        patchDef.type,
        patchDef.callback,
        patchDef.priority ?? 50
      );

      Patcher.applyPatch(target, patchDef.methodName, patch);
    }
  }

  private resolveModule(moduleName: string): Record<string, unknown> | null {
    const webpack = require("./webpack").Webpack;
    const module = webpack.findByProps(moduleName);
    if (module) return module as Record<string, unknown>;

    const store = webpack.findByStoreName(moduleName);
    if (store) return store as unknown as Record<string, unknown>;

    return null;
  }

  private getModuleTarget(
    module: Record<string, unknown>,
    methodName: string
  ): Record<string, unknown> | null {
    if (methodName in module) {
      return module;
    }

    if (module.default && typeof module.default === "object" && methodName in (module.default as Record<string, unknown>)) {
      return module.default as Record<string, unknown>;
    }

    return null;
  }

  isEnabled(pluginId: string): boolean {
    return PluginStorage.isEnabled(pluginId);
  }

  isRunning(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    try {
      const patches = Patcher.getPatchesForPlugin(pluginId);
      return patches.length > 0;
    } catch {
      return false;
    }
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getEnabledPlugins(): Plugin[] {
    return this.getAllPlugins().filter((p) => this.isEnabled(p.id));
  }

  getRunningPlugins(): Plugin[] {
    return this.getAllPlugins().filter((p) => this.isRunning(p.id));
  }

  search(query: string): Plugin[] {
    const lower = query.toLowerCase();
    return this.getAllPlugins().filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower) ||
        p.author.toLowerCase().includes(lower) ||
        p.id.toLowerCase().includes(lower)
    );
  }

  updatePluginConfig(pluginId: string, config: Record<string, unknown>): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    const storageData = PluginStorage.get(pluginId);
    if (!storageData) return false;

    storageData.config = config;
    PluginStorage.set(pluginId, storageData);

    if (plugin.onSettingsUpdate) {
      try {
        plugin.onSettingsUpdate(config);
      } catch (err) {
        log.error(`Failed to update settings for ${plugin.name}:`, err);
      }
    }

    return true;
  }

  getPluginConfig(pluginId: string): Record<string, unknown> {
    const storageData = PluginStorage.get(pluginId);
    return storageData?.config ?? {};
  }

  enableSystem(): void {
    this.enabled = true;
    SettingsStorage.setGeneral("enablePlugins", true);
    for (const plugin of this.getEnabledPlugins()) {
      if (!this.isRunning(plugin.id)) {
        this.startPlugin(plugin);
      }
    }
    log.info("Plugin system enabled");
  }

  disableSystem(): void {
    this.enabled = false;
    SettingsStorage.setGeneral("enablePlugins", false);
    for (const plugin of this.getRunningPlugins()) {
      this.stopPlugin(plugin);
      Patcher.unpatchAll(plugin.id);
    }
    log.info("Plugin system disabled");
  }

  isSystemEnabled(): boolean {
    return this.enabled;
  }

  getLoadOrder(): string[] {
    return [...this.loadOrder];
  }

  setPluginOrder(pluginId: string, order: number): boolean {
    const storageData = PluginStorage.get(pluginId);
    if (!storageData) return false;
    storageData.order = order;
    PluginStorage.set(pluginId, storageData);
    this.loadOrder.sort((a, b) => {
      const orderA = PluginStorage.get(a)?.order ?? 0;
      const orderB = PluginStorage.get(b)?.order ?? 0;
      return orderA - orderB;
    });
    return true;
  }

  cleanup(): void {
    for (const plugin of this.getRunningPlugins()) {
      this.stopPlugin(plugin);
    }
    for (const pluginId of this.plugins.keys()) {
      Patcher.unpatchAll(pluginId);
    }
    this.plugins.clear();
    this.loadOrder = [];
    log.info("Plugin manager cleaned up");
  }
}

export const Plugins = new PluginManager();

export default Plugins;
