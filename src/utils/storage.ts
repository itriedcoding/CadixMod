import { CADIXMOD_VERSION, DEFAULT_SETTINGS, STORAGE_KEYS } from "../shared/constants";
import { CadixSettings } from "../shared/types";
import { createLogger } from "./logger";

const log = createLogger("Storage", "#FF9900");

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStorage<T>(key: string, defaultValue: T): T {
  if (!isBrowser()) return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    log.error(`Failed to read key "${key}" from storage:`, err);
    return defaultValue;
  }
}

function writeStorage<T>(key: string, value: T): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    log.error(`Failed to write key "${key}" to storage:`, err);
    return false;
  }
}

function removeStorage(key: string): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (err) {
    log.error(`Failed to remove key "${key}" from storage:`, err);
    return false;
  }
}

function clearStorage(): boolean {
  if (!isBrowser()) return false;
  try {
    const keys = [
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.PLUGINS,
      STORAGE_KEYS.THEMES,
      STORAGE_KEYS.PLUGIN_CONFIGS,
      STORAGE_KEYS.THEME_CONFIGS,
      STORAGE_KEYS.FIRST_RUN,
      STORAGE_KEYS.LAST_VERSION,
    ];
    for (const key of keys) {
      window.localStorage.removeItem(key);
    }
    return true;
  } catch (err) {
    log.error("Failed to clear storage:", err);
    return false;
  }
}

function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key in source) {
    if (source[key] === undefined) continue;
    if (
      typeof source[key] === "object" &&
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof target[key] === "object" &&
      target[key] !== null &&
      !Array.isArray(target[key])
    ) {
      (result as Record<string, unknown>)[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      );
    } else {
      (result as Record<string, unknown>)[key] = source[key];
    }
  }
  return result;
}

export const SettingsStorage = {
  get(): CadixSettings {
    return readStorage<CadixSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  set(settings: CadixSettings): boolean {
    return writeStorage(STORAGE_KEYS.SETTINGS, settings);
  },

  update(partial: Partial<CadixSettings>): boolean {
    const current = this.get();
    const merged = deepMerge(current, partial);
    return this.set(merged);
  },

  reset(): boolean {
    return this.set(DEFAULT_SETTINGS);
  },

  getGeneral<K extends keyof CadixSettings["general"]>(
    key: K
  ): CadixSettings["general"][K] {
    const settings = this.get();
    return settings.general[key];
  },

  setGeneral<K extends keyof CadixSettings["general"]>(
    key: K,
    value: CadixSettings["general"][K]
  ): boolean {
    const settings = this.get();
    settings.general[key] = value;
    return this.set(settings);
  },

  getUI<K extends keyof CadixSettings["ui"]>(key: K): CadixSettings["ui"][K] {
    const settings = this.get();
    return settings.ui[key];
  },

  setUI<K extends keyof CadixSettings["ui"]>(
    key: K,
    value: CadixSettings["ui"][K]
  ): boolean {
    const settings = this.get();
    settings.ui[key] = value;
    return this.set(settings);
  },

  getDeveloper<K extends keyof CadixSettings["developer"]>(
    key: K
  ): CadixSettings["developer"][K] {
    const settings = this.get();
    return settings.developer[key];
  },

  setDeveloper<K extends keyof CadixSettings["developer"]>(
    key: K,
    value: CadixSettings["developer"][K]
  ): boolean {
    const settings = this.get();
    settings.developer[key] = value;
    return this.set(settings);
  },
};

export const PluginStorage = {
  getAll(): Record<string, { enabled: boolean; order: number; config: Record<string, unknown> }> {
    return readStorage(STORAGE_KEYS.PLUGIN_CONFIGS, {});
  },

  set(pluginId: string, data: { enabled: boolean; order: number; config: Record<string, unknown> }): boolean {
    const plugins = this.getAll();
    plugins[pluginId] = data;
    return writeStorage(STORAGE_KEYS.PLUGIN_CONFIGS, plugins);
  },

  get(pluginId: string): { enabled: boolean; order: number; config: Record<string, unknown> } | null {
    const plugins = this.getAll();
    return plugins[pluginId] ?? null;
  },

  remove(pluginId: string): boolean {
    const plugins = this.getAll();
    delete plugins[pluginId];
    return writeStorage(STORAGE_KEYS.PLUGIN_CONFIGS, plugins);
  },

  isEnabled(pluginId: string): boolean {
    const plugin = this.get(pluginId);
    return plugin?.enabled ?? false;
  },

  setEnabled(pluginId: string, enabled: boolean): boolean {
    const plugin = this.get(pluginId) ?? { enabled: false, order: 0, config: {} };
    plugin.enabled = enabled;
    return this.set(pluginId, plugin);
  },

  reset(): boolean {
    return writeStorage(STORAGE_KEYS.PLUGIN_CONFIGS, {});
  },
};

export const ThemeStorage = {
  getAll(): Record<string, { enabled: boolean; order: number; overrides: Record<string, string> }> {
    return readStorage(STORAGE_KEYS.THEME_CONFIGS, {});
  },

  set(themeId: string, data: { enabled: boolean; order: number; overrides: Record<string, string> }): boolean {
    const themes = this.getAll();
    themes[themeId] = data;
    return writeStorage(STORAGE_KEYS.THEME_CONFIGS, themes);
  },

  get(themeId: string): { enabled: boolean; order: number; overrides: Record<string, string> } | null {
    const themes = this.getAll();
    return themes[themeId] ?? null;
  },

  remove(themeId: string): boolean {
    const themes = this.getAll();
    delete themes[themeId];
    return writeStorage(STORAGE_KEYS.THEME_CONFIGS, themes);
  },

  isEnabled(themeId: string): boolean {
    const theme = this.get(themeId);
    return theme?.enabled ?? false;
  },

  setEnabled(themeId: string, enabled: boolean): boolean {
    const theme = this.get(themeId) ?? { enabled: false, order: 0, overrides: {} };
    theme.enabled = enabled;
    return this.set(themeId, theme);
  },

  reset(): boolean {
    return writeStorage(STORAGE_KEYS.THEME_CONFIGS, {});
  },
};

export const VersionStorage = {
  getLastVersion(): string {
    return readStorage(STORAGE_KEYS.LAST_VERSION, "");
  },

  setLastVersion(version: string): boolean {
    return writeStorage(STORAGE_KEYS.LAST_VERSION, version);
  },

  isFirstRun(): boolean {
    return readStorage(STORAGE_KEYS.FIRST_RUN, true);
  },

  setFirstRun(value: boolean): boolean {
    return writeStorage(STORAGE_KEYS.FIRST_RUN, value);
  },
};

export const storage = {
  get: readStorage,
  set: writeStorage,
  remove: removeStorage,
  clear: clearStorage,
  settings: SettingsStorage,
  plugins: PluginStorage,
  themes: ThemeStorage,
  version: VersionStorage,
};

export default storage;
