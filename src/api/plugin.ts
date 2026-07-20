// CadixMod Plugin API - Core plugin management system

import type { Plugin, PluginManifest, ModulePatch } from "../shared/types";
import { logger } from "../utils/logger";
import { storage } from "../utils/storage";

class PluginManager {
  private static instance: PluginManager;
  private plugins: Map<string, Plugin> = new Map();
  private patches: ModulePatch[] = [];
  private loaded: boolean = false;

  private constructor() {}

  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.loaded) return;

    logger.info("Initializing plugin system...");

    await this.loadBuiltInPlugins();
    this.applyPatches();

    this.loaded = true;
    logger.info(`Plugin system ready (${this.plugins.size} plugins loaded)`);
  }

  private async loadBuiltInPlugins(): Promise<void> {
    const builtInPlugins: Plugin[] = [];

    for (const plugin of builtInPlugins) {
      this.register(plugin);
    }
  }

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      logger.warn(`Plugin "${plugin.name}" is already registered`);
      return;
    }

    const settings = storage.getPluginSettings(plugin.name);
    if (settings.enabled !== false) {
      try {
        plugin.start();
        logger.debug(`Plugin "${plugin.name}" started`);
      } catch (err) {
        logger.error(`Failed to start plugin "${plugin.name}":`, err);
      }
    }

    this.plugins.set(plugin.name, plugin);
  }

  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      try {
        plugin.stop();
      } catch (err) {
        logger.error(`Failed to stop plugin "${name}":`, err);
      }
      this.plugins.delete(name);
    }
  }

  enable(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      storage.setPluginSettings(name, {
        enabled: true,
        settings: storage.getPluginSettings(name).settings,
      });
      try {
        plugin.start();
        logger.debug(`Plugin "${name}" enabled`);
      } catch (err) {
        logger.error(`Failed to enable plugin "${name}":`, err);
      }
    }
  }

  disable(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      storage.setPluginSettings(name, {
        enabled: false,
        settings: storage.getPluginSettings(name).settings,
      });
      try {
        plugin.stop();
        logger.debug(`Plugin "${name}" disabled`);
      } catch (err) {
        logger.error(`Failed to disable plugin "${name}":`, err);
      }
    }
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getEnabled(): Plugin[] {
    return this.getAll().filter((p) =>
      storage.isPluginEnabled(p.name)
    );
  }

  addPatch(patch: ModulePatch): void {
    this.patches.push(patch);
  }

  private applyPatches(): void {
    for (const patch of this.patches) {
      this.applyPatch(patch);
    }
  }

  private applyPatch(patch: ModulePatch): void {
    logger.debug(`Applying patch for module: ${patch.module}`);
  }

  search(query: string): Plugin[] {
    const lower = query.toLowerCase();
    return this.getAll().filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower) ||
        (p.tags?.some((t) => t.toLowerCase().includes(lower)) ?? false)
    );
  }
}

export const pluginManager = PluginManager.getInstance();
export default pluginManager;
