import { createLogger } from "../utils/logger";
import { Theme } from "../shared/types";
import { ThemeStorage, SettingsStorage } from "../utils/storage";
import { CADIXMOD_VERSION } from "../shared/constants";

const log = createLogger("Themes", "#EB459E");

const THEME_STYLE_ID_PREFIX = "cadixmod-theme-";

class ThemeEngine {
  private themes: Map<string, Theme> = new Map();
  private loadedStyles: Map<string, HTMLStyleElement> = new Map();
  private observer: MutationObserver | null = null;
  private enabled = true;
  private reloadTimers: Map<string, ReturnType<typeof setTimeout>> = new Map;

  init(): void {
    this.enabled = SettingsStorage.getGeneral("enableThemes");
    this.setupObserver();
    log.info("Theme engine initialized");
  }

  private setupObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node instanceof HTMLStyleElement && node.dataset.cadixTheme) {
              const themeId = node.dataset.cadixTheme;
              if (!this.loadedStyles.has(themeId)) {
                this.loadedStyles.set(themeId, node);
              }
            }
          }
        }
      }
    });

    this.observer.observe(document.head, {
      childList: true,
      subtree: true,
    });
  }

  register(theme: Theme): boolean {
    if (this.themes.has(theme.id)) {
      log.warn(`Theme "${theme.name}" is already registered`);
      return false;
    }

    this.themes.set(theme.id, theme);
    log.info(`Registered theme: ${theme.name} v${theme.version}`);

    const storageData = ThemeStorage.get(theme.id);
    if (storageData) {
      theme.enabled = storageData.enabled;
    }

    if (theme.enabled && this.enabled) {
      this.applyTheme(theme);
    }

    return true;
  }

  unregister(themeId: string): boolean {
    const theme = this.themes.get(themeId);
    if (!theme) {
      log.warn(`Theme ${themeId} not found`);
      return false;
    }

    this.removeTheme(themeId);
    this.themes.delete(themeId);
    ThemeStorage.remove(themeId);
    log.info(`Unregistered theme: ${theme.name}`);
    return true;
  }

  applyTheme(theme: Theme): void {
    if (!this.enabled) return;

    this.removeTheme(theme.id);

    const styleEl = document.createElement("style");
    styleEl.id = `${THEME_STYLE_ID_PREFIX}${theme.id}`;
    styleEl.dataset.cadixTheme = theme.id;

    let css = theme.css;

    if (theme.variables && Object.keys(theme.variables).length > 0) {
      const rootVars = Object.entries(theme.variables)
        .map(([key, value]) => `  ${key}: ${value};`)
        .join("\n");
      css = `:root {\n${rootVars}\n}\n\n${css}`;
    }

    const storageData = ThemeStorage.get(theme.id);
    if (storageData?.overrides) {
      const overrideVars = Object.entries(storageData.overrides)
        .map(([key, value]) => `  ${key}: ${value};`)
        .join("\n");
      if (overrideVars) {
        css = `:root {\n${overrideVars}\n}\n\n${css}`;
      }
    }

    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    this.loadedStyles.set(theme.id, styleEl);

    log.debug(`Applied theme: ${theme.name}`);
  }

  removeTheme(themeId: string): void {
    const existing = document.getElementById(`${THEME_STYLE_ID_PREFIX}${themeId}`);
    if (existing) {
      existing.remove();
    }
    this.loadedStyles.delete(themeId);
  }

  enableTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId);
    if (!theme) {
      log.warn(`Theme ${themeId} not found`);
      return false;
    }

    theme.enabled = true;
    ThemeStorage.setEnabled(themeId, true);
    this.applyTheme(theme);
    log.info(`Enabled theme: ${theme.name}`);
    return true;
  }

  disableTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId);
    if (!theme) {
      log.warn(`Theme ${themeId} not found`);
      return false;
    }

    theme.enabled = false;
    ThemeStorage.setEnabled(themeId, false);
    this.removeTheme(themeId);
    log.info(`Disabled theme: ${theme.name}`);
    return true;
  }

  toggleTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId);
    if (!theme) return false;
    return theme.enabled ? this.disableTheme(themeId) : this.enableTheme(themeId);
  }

  enableAll(): void {
    this.enabled = true;
    SettingsStorage.setGeneral("enableThemes", true);
    for (const theme of this.themes.values()) {
      if (theme.enabled) {
        this.applyTheme(theme);
      }
    }
  }

  disableAll(): void {
    this.enabled = false;
    SettingsStorage.setGeneral("enableThemes", false);
    for (const themeId of this.themes.keys()) {
      this.removeTheme(themeId);
    }
  }

  reloadTheme(themeId: string): void {
    const theme = this.themes.get(themeId);
    if (!theme) return;

    if (this.reloadTimers.has(themeId)) {
      clearTimeout(this.reloadTimers.get(themeId)!);
    }

    this.reloadTimers.set(
      themeId,
      setTimeout(() => {
        if (theme.enabled && this.enabled) {
          this.removeTheme(themeId);
          this.applyTheme(theme);
          log.info(`Reloaded theme: ${theme.name}`);
        }
        this.reloadTimers.delete(themeId);
      }, 300)
    );
  }

  setupLiveReload(themeId: string, cssPath: string): void {
    let lastModified = "";

    const checkForChanges = async () => {
      try {
        const response = await fetch(cssPath, { method: "HEAD" });
        const newModified = response.headers.get("last-modified") || "";

        if (lastModified && newModified !== lastModified) {
          this.reloadTheme(themeId);
        }
        lastModified = newModified;
      } catch (err) {
        // fetch failed, ignore
      }
    };

    setInterval(checkForChanges, 5000);
  }

  parseTheme(css: string, metadata?: Partial<Theme>): Theme {
    const nameMatch = css.match(/@name\s+([^\n]+)/);
    const authorMatch = css.match(/@author\s+([^\n]+)/);
    const descriptionMatch = css.match(/@description\s+([^\n]+)/);
    const versionMatch = css.match(/@version\s+([^\n]+)/);

    const variables: Record<string, string> = {};
    const varRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
    let varMatch;
    while ((varMatch = varRegex.exec(css)) !== null) {
      variables[`--${varMatch[1]}`] = varMatch[2].trim();
    }

    return {
      id: metadata?.id ?? `custom-${Date.now()}`,
      name: metadata?.name ?? nameMatch?.[1]?.trim() ?? "Custom Theme",
      description: metadata?.description ?? descriptionMatch?.[1]?.trim() ?? "",
      version: metadata?.version ?? versionMatch?.[1]?.trim() ?? "1.0.0",
      author: metadata?.author ?? authorMatch?.[1]?.trim() ?? "Unknown",
      css,
      variables,
      enabled: metadata?.enabled ?? true,
    };
  }

  loadFromCSS(css: string, metadata?: Partial<Theme>): Theme {
    const theme = this.parseTheme(css, metadata);
    this.register(theme);
    return theme;
  }

  getTheme(themeId: string): Theme | undefined {
    return this.themes.get(themeId);
  }

  getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  getEnabledThemes(): Theme[] {
    return this.getAllThemes().filter((t) => t.enabled);
  }

  isThemeEnabled(themeId: string): boolean {
    const theme = this.themes.get(themeId);
    return theme?.enabled ?? false;
  }

  setThemeVariable(themeId: string, variable: string, value: string): void {
    const theme = this.themes.get(themeId);
    if (!theme) return;

    theme.variables[variable] = value;
    const storageData = ThemeStorage.get(themeId) ?? {
      enabled: theme.enabled,
      order: 0,
      overrides: {},
    };
    storageData.overrides[variable] = value;
    ThemeStorage.set(themeId, storageData);

    if (theme.enabled && this.enabled) {
      this.reloadTheme(themeId);
    }
  }

  cleanup(): void {
    for (const themeId of this.themes.keys()) {
      this.removeTheme(themeId);
    }
    this.themes.clear();
    this.loadedStyles.clear();

    for (const timer of this.reloadTimers.values()) {
      clearTimeout(timer);
    }
    this.reloadTimers.clear();

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    log.info("Theme engine cleaned up");
  }
}

export const Themes = new ThemeEngine();

export default Themes;
