// CadixMod Plugin: Plugin Loader
// Loads and manages external plugins from ~/.cadixmod/plugins/ via IPC

import type { Plugin } from "../../shared/types";
import { logger } from "../../utils/logger";

const ENABLED_PLUGINS_KEY = "cadixmod_external_plugins_enabled";

interface ExternalPluginMeta {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  fileName: string;
  enabled: boolean;
  instance: Plugin | null;
}

declare global {
  interface Window {
    CadixMod?: {
      ipc: {
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
        on: (channel: string, callback: (...args: unknown[]) => void) => void;
        send: (channel: string, data: unknown) => void;
      };
    };
  }
}

const externalPlugins: Map<string, ExternalPluginMeta> = new Map();

function getEnabledState(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(ENABLED_PLUGINS_KEY) || "{}");
  } catch {
    return {};
  }
}

function setEnabledState(name: string, enabled: boolean): void {
  const state = getEnabledState();
  state[name] = enabled;
  localStorage.setItem(ENABLED_PLUGINS_KEY, JSON.stringify(state));
}

function escapeHTML(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function fetchPluginList(): Promise<string[]> {
  try {
    const ipc = window.CadixMod?.ipc;
    if (!ipc) return [];
    const result = await ipc.invoke("cadixmod:listPlugins");
    if (Array.isArray(result)) return result as string[];
    return [];
  } catch {
    return [];
  }
}

async function fetchPluginSource(fileName: string): Promise<string | null> {
  try {
    const ipc = window.CadixMod?.ipc;
    if (!ipc) return null;
    const result = await ipc.invoke("cadixmod:readPlugin", fileName);
    if (typeof result === "string") return result;
    return null;
  } catch {
    return null;
  }
}

function evaluatePluginCode(code: string, fileName: string): Plugin | null {
  try {
    const blob = new Blob([code], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);

    let exports: Record<string, unknown> = {};
    const moduleObj = { exports: {} };
    const requireFunc = () => ({ default: {} });

    const fn = new Function("module", "exports", "require", "URL", code);
    fn(moduleObj, moduleObj.exports, requireFunc, URL);
    exports = moduleObj.exports as Record<string, unknown>;
    URL.revokeObjectURL(url);

    const plugin = (exports.default || exports) as Plugin;
    if (
      plugin &&
      typeof plugin === "object" &&
      typeof plugin.start === "function" &&
      typeof plugin.stop === "function"
    ) {
      return plugin;
    }

    logger.warn(`File ${fileName} does not export a valid plugin`);
    return null;
  } catch (err) {
    logger.error(`Failed to evaluate plugin ${fileName}:`, err);
    return null;
  }
}

async function loadPlugin(fileName: string): Promise<boolean> {
  if (externalPlugins.has(fileName)) return true;

  const source = await fetchPluginSource(fileName);
  if (!source) return false;

  const pluginInstance = evaluatePluginCode(source, fileName);
  if (!pluginInstance) return false;

  const enabled = getEnabledState()[pluginInstance.name] !== false;

  externalPlugins.set(fileName, {
    id: pluginInstance.id || pluginInstance.name.toLowerCase().replace(/\s+/g, "_"),
    name: pluginInstance.name,
    description: pluginInstance.description || "No description",
    version: pluginInstance.version || "0.0.0",
    author: pluginInstance.author || "Unknown",
    fileName,
    enabled,
    instance: pluginInstance,
  });

  if (enabled) {
    try {
      pluginInstance.start();
      logger.info(`Loaded external plugin: ${pluginInstance.name}`);
    } catch (err) {
      logger.error(`Failed to start external plugin ${pluginInstance.name}:`, err);
    }
  }

  return true;
}

function renderExternalPluginsPanel(container: HTMLElement): void {
  const plugins = Array.from(externalPlugins.values());

  container.innerHTML = `
    <div class="cadixmod-settings-section">
      <h3>External Plugins</h3>
      <p style="color: #b5bac1; font-size: 13px; margin-bottom: 16px;">
        Plugins loaded from ~/.cadixmod/plugins/
      </p>
      <div id="cadixmod-external-plugin-list">
        ${plugins.length === 0
          ? '<p style="color: #80848e; font-size: 13px;">No external plugins loaded. Place .js files in the plugins directory and restart.</p>'
          : plugins
              .map(
                (p) => `
          <div class="cadixmod-plugin-item" data-ext-plugin="${escapeHTML(p.fileName)}">
            <div class="cadixmod-plugin-icon" style="background: ${p.enabled ? "#23a55a" : "#4e5058"};">
              ${escapeHTML(p.name.charAt(0).toUpperCase())}
            </div>
            <div class="cadixmod-plugin-info">
              <div class="cadixmod-plugin-name">${escapeHTML(p.name)}</div>
              <div class="cadixmod-plugin-desc">${escapeHTML(p.description)}</div>
              <div class="cadixmod-plugin-version">v${escapeHTML(p.version)} by ${escapeHTML(p.author)}</div>
            </div>
            <label class="cadixmod-toggle">
              <input type="checkbox" data-ext-toggle="${escapeHTML(p.fileName)}" ${p.enabled ? "checked" : ""}>
              <span class="cadixmod-toggle-slider"></span>
            </label>
          </div>
        `
              )
              .join("")}
      </div>
    </div>
  `;

  container.querySelectorAll("input[data-ext-toggle]").forEach((input) => {
    input.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const fileName = target.dataset.extToggle;
      if (!fileName) return;

      const meta = externalPlugins.get(fileName);
      if (!meta || !meta.instance) return;

      if (target.checked) {
        try {
          meta.instance.start();
          meta.enabled = true;
          setEnabledState(meta.name, true);
          const icon = target.closest(".cadixmod-plugin-item")?.querySelector(".cadixmod-plugin-icon") as HTMLElement;
          if (icon) icon.style.background = "#23a55a";
          logger.info(`Enabled external plugin: ${meta.name}`);
        } catch (err) {
          logger.error(`Failed to start external plugin ${meta.name}:`, err);
          target.checked = false;
        }
      } else {
        try {
          meta.instance.stop();
          meta.enabled = false;
          setEnabledState(meta.name, false);
          const icon = target.closest(".cadixmod-plugin-item")?.querySelector(".cadixmod-plugin-icon") as HTMLElement;
          if (icon) icon.style.background = "#4e5058";
          logger.info(`Disabled external plugin: ${meta.name}`);
        } catch (err) {
          logger.error(`Failed to stop external plugin ${meta.name}:`, err);
        }
      }
    });
  });
}

function cleanupExternalPlugins(): void {
  for (const [, meta] of externalPlugins) {
    if (meta.enabled && meta.instance) {
      try {
        meta.instance.stop();
      } catch (err) {
        logger.error(`Failed to stop external plugin ${meta.name} during cleanup:`, err);
      }
    }
  }
  externalPlugins.clear();
}

const plugin: Plugin = {
  id: "pluginloader",
  name: "PluginLoader",
  description: "Load and manage custom plugins",
  version: "1.0.0",
  author: "CadixMod",
  patches: [],

  async start() {
    logger.debug("PluginLoader started");

    const files = await fetchPluginList();
    for (const file of files) {
      if (file.endsWith(".js") || file.endsWith(".mjs")) {
        await loadPlugin(file);
      }
    }
  },

  stop() {
    logger.debug("PluginLoader stopped");
    cleanupExternalPlugins();
  },

  async load() {
    const files = await fetchPluginList();
    for (const file of files) {
      if (file.endsWith(".js") || file.endsWith(".mjs")) {
        await loadPlugin(file);
      }
    }
  },

  unload() {
    cleanupExternalPlugins();
  },
};

export default plugin;
