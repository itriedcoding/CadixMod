// CadixMod Settings Panel - UI for managing settings and plugins

import { storage } from "../utils/storage";
import { pluginManager } from "../api/plugin";
import { logger } from "../utils/logger";

const SETTINGS_BUTTON_SELECTOR = ".toolbar-1t9fwZK";
const PANEL_ID = "cadixmod-settings-panel";

let panelOpen = false;
let settingsPanel: HTMLDivElement | null = null;

export function injectSettingsButton(): void {
  const observer = new MutationObserver(() => {
    const toolbar = document.querySelector(SETTINGS_BUTTON_SELECTOR);
    if (toolbar && !document.querySelector("#cadixmod-settings-btn")) {
      const btn = document.createElement("div");
      btn.id = "cadixmod-settings-btn";
      btn.className = "toolbarButton-2RjMVy";
      btn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L14.5 9H22L16 13.5L18 21L12 17L6 21L8 13.5L2 9H9.5L12 2Z" 
                fill="currentColor" opacity="0.9"/>
        </svg>
      `;
      btn.title = "CadixMod Settings";
      btn.addEventListener("click", toggleSettingsPanel);
      toolbar.insertBefore(btn, toolbar.firstChild);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

export function removeSettingsButton(): void {
  const btn = document.querySelector("#cadixmod-settings-btn");
  btn?.remove();
}

function toggleSettingsPanel(): void {
  if (panelOpen) {
    closeSettingsPanel();
  } else {
    openSettingsPanel();
  }
}

function openSettingsPanel(): void {
  if (panelOpen) return;

  settingsPanel = document.createElement("div");
  settingsPanel.id = PANEL_ID;
  settingsPanel.innerHTML = createSettingsHTML();
  document.body.appendChild(settingsPanel);

  attachSettingsListeners();
  panelOpen = true;

  logger.debug("Settings panel opened");
}

function closeSettingsPanel(): void {
  if (!panelOpen || !settingsPanel) return;

  settingsPanel.remove();
  settingsPanel = null;
  panelOpen = false;

  logger.debug("Settings panel closed");
}

function createSettingsHTML(): string {
  const settings = storage.getAll();
  const plugins = pluginManager.getAll();

  return `
    <div class="cadixmod-overlay" id="cadixmod-overlay">
      <div class="cadixmod-panel">
        <div class="cadixmod-header">
          <h2>CadixMod Settings</h2>
          <button class="cadixmod-close" id="cadixmod-close">&times;</button>
        </div>
        <div class="cadixmod-tabs">
          <button class="cadixmod-tab active" data-tab="general">General</button>
          <button class="cadixmod-tab" data-tab="plugins">Plugins</button>
          <button class="cadixmod-tab" data-tab="themes">Themes</button>
          <button class="cadixmod-tab" data-tab="advanced">Advanced</button>
        </div>
        <div class="cadixmod-content" id="cadixmod-content">
          ${createGeneralTab(settings)}
          ${createPluginsTab(plugins)}
          ${createThemesTab()}
          ${createAdvancedTab(settings)}
        </div>
      </div>
    </div>
  `;
}

function createGeneralTab(settings: any): string {
  return `
    <div class="cadixmod-tab-content active" data-tab-content="general">
      <div class="cadixmod-section">
        <h3>General Settings</h3>
        <label class="cadixmod-toggle">
          <input type="checkbox" id="cadixmod-enabled" ${settings.enabled ? "checked" : ""}>
          <span>Enable CadixMod</span>
        </label>
        <label class="cadixmod-toggle">
          <input type="checkbox" id="cadixmod-autoupdate" ${settings.autoUpdate ? "checked" : ""}>
          <span>Auto Update</span>
        </label>
        <label class="cadixmod-toggle">
          <input type="checkbox" id="cadixmod-devmode" ${settings.developerMode ? "checked" : ""}>
          <span>Developer Mode</span>
        </label>
      </div>
      <div class="cadixmod-section">
        <h3>Custom CSS</h3>
        <textarea id="cadixmod-css" rows="6" placeholder="Enter custom CSS...">${settings.customCSS || ""}</textarea>
      </div>
    </div>
  `;
}

function createPluginsTab(plugins: any[]): string {
  const pluginList = plugins
    .map(
      (p) => `
    <div class="cadixmod-plugin">
      <div class="cadixmod-plugin-info">
        <span class="cadixmod-plugin-name">${p.name}</span>
        <span class="cadixmod-plugin-desc">${p.description}</span>
        <span class="cadixmod-plugin-version">v${p.version} by ${p.author}</span>
      </div>
      <label class="cadixmod-switch">
        <input type="checkbox" class="cadixmod-plugin-toggle" data-plugin="${p.name}" 
               ${storage.isPluginEnabled(p.name) ? "checked" : ""}>
        <span class="cadixmod-slider"></span>
      </label>
    </div>
  `
    )
    .join("");

  return `
    <div class="cadixmod-tab-content" data-tab-content="plugins">
      <div class="cadixmod-section">
        <h3>Installed Plugins</h3>
        <div class="cadixmod-plugin-list">${pluginList || "<p>No plugins installed</p>"}</div>
      </div>
    </div>
  `;
}

function createThemesTab(): string {
  return `
    <div class="cadixmod-tab-content" data-tab-content="themes">
      <div class="cadixmod-section">
        <h3>Themes</h3>
        <select id="cadixmod-theme" class="cadixmod-select">
          <option value="default">Default</option>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="amoled">AMOLED</option>
        </select>
      </div>
    </div>
  `;
}

function createAdvancedTab(settings: any): string {
  return `
    <div class="cadixmod-tab-content" data-tab-content="advanced">
      <div class="cadixmod-section">
        <h3>Advanced</h3>
        <label class="cadixmod-toggle">
          <input type="checkbox" id="cadixmod-experimental" ${settings.experimentalFeatures ? "checked" : ""}>
          <span>Experimental Features</span>
        </label>
        <label class="cadixmod-toggle">
          <input type="checkbox" id="cadixmod-notifications" ${settings.notifications ? "checked" : ""}>
          <span>Notifications</span>
        </label>
      </div>
      <div class="cadixmod-section">
        <h3>Debug Info</h3>
        <p>Version: 1.0.0</p>
        <p>Platform: ${navigator.platform}</p>
        <p>Plugins: ${pluginManager.getAll().length}</p>
        <p>Patches: ${pluginManager.getAll().length}</p>
      </div>
      <div class="cadixmod-section">
        <button class="cadixmod-button cadixmod-danger" id="cadixmod-reset">Reset Settings</button>
        <button class="cadixmod-button" id="cadixmod-restart">Restart Discord</button>
      </div>
    </div>
  `;
}

function attachSettingsListeners(): void {
  const overlay = document.getElementById("cadixmod-overlay");
  const closeBtn = document.getElementById("cadixmod-close");

  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) closeSettingsPanel();
  });

  closeBtn?.addEventListener("click", closeSettingsPanel);

  document.querySelectorAll(".cadixmod-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".cadixmod-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".cadixmod-tab-content").forEach((c) => c.classList.remove("active"));

      tab.classList.add("active");
      const tabName = (tab as HTMLElement).dataset.tab;
      document.querySelector(`[data-tab-content="${tabName}"]`)?.classList.add("active");
    });
  });

  document.getElementById("cadixmod-enabled")?.addEventListener("change", (e) => {
    storage.set("enabled", (e.target as HTMLInputElement).checked);
  });

  document.getElementById("cadixmod-autoupdate")?.addEventListener("change", (e) => {
    storage.set("autoUpdate", (e.target as HTMLInputElement).checked);
  });

  document.getElementById("cadixmod-devmode")?.addEventListener("change", (e) => {
    storage.set("developerMode", (e.target as HTMLInputElement).checked);
  });

  document.getElementById("cadixmod-css")?.addEventListener("input", (e) => {
    storage.set("customCSS", (e.target as HTMLTextAreaElement).value);
  });

  document.querySelectorAll(".cadixmod-plugin-toggle").forEach((toggle) => {
    toggle.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const pluginName = target.dataset.plugin;
      if (pluginName) {
        if (target.checked) {
          pluginManager.enable(pluginName);
        } else {
          pluginManager.disable(pluginName);
        }
      }
    });
  });

  document.getElementById("cadixmod-reset")?.addEventListener("click", () => {
    if (confirm("Reset all CadixMod settings?")) {
      storage.reset();
      closeSettingsPanel();
    }
  });

  document.getElementById("cadixmod-restart")?.addEventListener("click", () => {
    window.CadixMod?.system?.restart();
  });
}

export { settingsPanel, panelOpen };
