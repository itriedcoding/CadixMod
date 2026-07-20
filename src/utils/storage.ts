// CadixMod Storage - Persistent settings and data storage

import { DEFAULT_SETTINGS } from "../shared/constants";
import type { CadixSettings, PluginSettings } from "../shared/types";

class Storage {
  private static instance: Storage;
  private data: CadixSettings;
  private storageKey = "cadixmod_settings";

  private constructor() {
    this.data = this.load();
  }

  static getInstance(): Storage {
    if (!Storage.instance) {
      Storage.instance = new Storage();
    }
    return Storage.instance;
  }

  private load(): CadixSettings {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
      }
    } catch (err) {
      console.error("[CadixMod] Failed to load settings:", err);
    }
    return { ...DEFAULT_SETTINGS };
  }

  save(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      }
    } catch (err) {
      console.error("[CadixMod] Failed to save settings:", err);
    }
  }

  get<K extends keyof CadixSettings>(key: K): CadixSettings[K] {
    return this.data[key];
  }

  set<K extends keyof CadixSettings>(key: K, value: CadixSettings[K]): void {
    this.data[key] = value;
    this.save();
  }

  getAll(): CadixSettings {
    return { ...this.data };
  }

  update(settings: Partial<CadixSettings>): void {
    this.data = { ...this.data, ...settings };
    this.save();
  }

  getPluginSettings(pluginName: string): PluginSettings {
    return this.data.plugins[pluginName] || { enabled: true, settings: {} };
  }

  setPluginSettings(pluginName: string, settings: PluginSettings): void {
    this.data.plugins[pluginName] = settings;
    this.save();
  }

  isPluginEnabled(pluginName: string): boolean {
    const plugin = this.data.plugins[pluginName];
    return plugin?.enabled ?? true;
  }

  reset(): void {
    this.data = { ...DEFAULT_SETTINGS };
    this.save();
  }
}

export const storage = Storage.getInstance();
export default storage;
