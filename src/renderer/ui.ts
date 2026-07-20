import { createLogger } from "../utils/logger";
import { ToastOptions, ModalOptions, ModalButton, NavItem } from "../shared/types";
import { CADIXMOD_VERSION } from "../shared/constants";

const log = createLogger("UI", "#5865F2");

const SETTINGS_BUTTON_ID = "cadixmod-settings-button";
const TOAST_CONTAINER_ID = "cadixmod-toast-container";
const SETTINGS_OVERLAY_CLASS = "cadixmod-settings-overlay";
const MODAL_OVERLAY_CLASS = "cadixmod-modal-overlay";

interface SettingsTab {
  id: string;
  label: string;
  icon: string;
  render: (container: HTMLElement) => void;
}

let settingsTabs: SettingsTab[] = [];
let activeTabId = "general";

const SETTINGS_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.98l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64L19.43 12.97z"/></svg>`;
const CLOSE_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;

function getDefaultTabs(): SettingsTab[] {
  return [
    {
      id: "general",
      label: "General",
      icon: "\u2699\uFE0F",
      render: renderGeneralTab,
    },
    {
      id: "plugins",
      label: "Plugins",
      icon: "\uD83D\uDD0C",
      render: renderPluginsTab,
    },
    {
      id: "themes",
      label: "Themes",
      icon: "\uD83C\uDFA8",
      render: renderThemesTab,
    },
    {
      id: "developer",
      label: "Developer",
      icon: "\uD83D\uDCBB",
      render: renderDeveloperTab,
    },
  ];
}

function renderGeneralTab(container: HTMLElement): void {
  const { SettingsStorage } = require("../utils/storage");
  const settings = SettingsStorage.get();

  container.innerHTML = `
    <div class="cadixmod-settings-section">
      <h3>General Settings</h3>
      <p>Configure basic CadixMod behavior.</p>
      <div class="cadixmod-setting-row">
        <div>
          <div class="cadixmod-setting-label">Enable Plugins</div>
          <div class="cadixmod-setting-description">Allow plugins to run</div>
        </div>
        <label class="cadixmod-toggle">
          <input type="checkbox" data-setting="enablePlugins" ${settings.general.enablePlugins ? "checked" : ""}>
          <span class="cadixmod-toggle-slider"></span>
        </label>
      </div>
      <div class="cadixmod-setting-row">
        <div>
          <div class="cadixmod-setting-label">Enable Themes</div>
          <div class="cadixmod-setting-description">Apply custom themes</div>
        </div>
        <label class="cadixmod-toggle">
          <input type="checkbox" data-setting="enableThemes" ${settings.general.enableThemes ? "checked" : ""}>
          <span class="cadixmod-toggle-slider"></span>
        </label>
      </div>
      <div class="cadixmod-setting-row">
        <div>
          <div class="cadixmod-setting-label">Debug Mode</div>
          <div class="cadixmod-setting-description">Enable verbose logging</div>
        </div>
        <label class="cadixmod-toggle">
          <input type="checkbox" data-setting="debugMode" ${settings.general.debugMode ? "checked" : ""}>
          <span class="cadixmod-toggle-slider"></span>
        </label>
      </div>
      <div class="cadixmod-setting-row">
        <div>
          <div class="cadixmod-setting-label">Show Badges</div>
          <div class="cadixmod-setting-description">Show CadixMod badges</div>
        </div>
        <label class="cadixmod-toggle">
          <input type="checkbox" data-setting="showBadges" ${settings.ui.showBadges ? "checked" : ""}>
          <span class="cadixmod-toggle-slider"></span>
        </label>
      </div>
      <div class="cadixmod-setting-row">
        <div>
          <div class="cadixmod-setting-label">Show Toasts</div>
          <div class="cadixmod-setting-description">Show notification toasts</div>
        </div>
        <label class="cadixmod-toggle">
          <input type="checkbox" data-setting="showToasts" ${settings.ui.showToasts ? "checked" : ""}>
          <span class="cadixmod-toggle-slider"></span>
        </label>
      </div>
    </div>
  `;

  container.querySelectorAll("input[data-setting]").forEach((input) => {
    input.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const key = target.dataset.setting;
      if (!key) return;
      const value = target.checked;
      if (key in settings.general) {
        (settings.general as Record<string, unknown>)[key] = value;
      } else if (key in settings.ui) {
        (settings.ui as Record<string, unknown>)[key] = value;
      }
      SettingsStorage.set(settings);
    });
  });
}

function renderPluginsTab(container: HTMLElement): void {
  let plugins: Array<{ id: string; name: string; description: string; version: string; author: string; enabled: boolean }> = [];
  try {
    const pluginManager = require("./plugins").Plugins;
    plugins = pluginManager.getAllPlugins().map((p: { id: string; name: string; description: string; version: string; author: string }) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      version: p.version,
      author: p.author,
      enabled: pluginManager.isEnabled(p.id),
    }));
  } catch (err) {
    // Plugins not available
  }

  container.innerHTML = `
    <div class="cadixmod-settings-section">
      <h3>Plugins</h3>
      <p>Manage installed plugins.</p>
      <div class="cadixmod-settings-search">
        <input type="text" class="cadixmod-input" placeholder="Search plugins..." id="cadixmod-plugin-search">
      </div>
      <div id="cadixmod-plugin-list" style="margin-top: 12px;">
        ${plugins.length === 0 ? '<p style="color: #b5bac1;">No plugins installed.</p>' : ""}
        ${plugins
          .map(
            (p) => `
          <div class="cadixmod-plugin-item" data-plugin-id="${p.id}">
            <div class="cadixmod-plugin-icon">${p.name.charAt(0).toUpperCase()}</div>
            <div class="cadixmod-plugin-info">
              <div class="cadixmod-plugin-name">${p.name}</div>
              <div class="cadixmod-plugin-desc">${p.description}</div>
              <div class="cadixmod-plugin-version">v${p.version} by ${p.author}</div>
            </div>
            <label class="cadixmod-toggle">
              <input type="checkbox" data-plugin-toggle="${p.id}" ${p.enabled ? "checked" : ""}>
              <span class="cadixmod-toggle-slider"></span>
            </label>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  container.querySelectorAll("input[data-plugin-toggle]").forEach((input) => {
    input.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const pluginId = target.dataset.pluginToggle;
      if (!pluginId) return;
      try {
        const pluginManager = require("./plugins").Plugins;
        if (target.checked) {
          pluginManager.enable(pluginId);
        } else {
          pluginManager.disable(pluginId);
        }
      } catch (err) {
        log.error("Failed to toggle plugin:", err);
      }
    });
  });

  const searchInput = container.querySelector("#cadixmod-plugin-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      const items = container.querySelectorAll(".cadixmod-plugin-item");
      items.forEach((item) => {
        const el = item as HTMLElement;
        const text = el.textContent?.toLowerCase() ?? "";
        el.style.display = text.includes(query) ? "" : "none";
      });
    });
  }
}

function renderThemesTab(container: HTMLElement): void {
  let themes: Array<{ id: string; name: string; description: string; version: string; author: string; enabled: boolean }> = [];
  try {
    const themeEngine = require("./themes").Themes;
    themes = themeEngine.getAllThemes().map((t: { id: string; name: string; description: string; version: string; author: string; enabled: boolean }) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      version: t.version,
      author: t.author,
      enabled: t.enabled,
    }));
  } catch (err) {
    // Themes not available
  }

  container.innerHTML = `
    <div class="cadixmod-settings-section">
      <h3>Themes</h3>
      <p>Manage installed themes.</p>
      <div id="cadixmod-theme-list" style="margin-top: 12px;">
        ${themes.length === 0 ? '<p style="color: #b5bac1;">No themes installed.</p>' : ""}
        ${themes
          .map(
            (t) => `
          <div class="cadixmod-plugin-item" data-theme-id="${t.id}">
            <div class="cadixmod-plugin-icon">${t.name.charAt(0).toUpperCase()}</div>
            <div class="cadixmod-plugin-info">
              <div class="cadixmod-plugin-name">${t.name}</div>
              <div class="cadixmod-plugin-desc">${t.description}</div>
              <div class="cadixmod-plugin-version">v${t.version} by ${t.author}</div>
            </div>
            <label class="cadixmod-toggle">
              <input type="checkbox" data-theme-toggle="${t.id}" ${t.enabled ? "checked" : ""}>
              <span class="cadixmod-toggle-slider"></span>
            </label>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  container.querySelectorAll("input[data-theme-toggle]").forEach((input) => {
    input.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const themeId = target.dataset.themeToggle;
      if (!themeId) return;
      try {
        const themeEngine = require("./themes").Themes;
        if (target.checked) {
          themeEngine.enableTheme(themeId);
        } else {
          themeEngine.disableTheme(themeId);
        }
      } catch (err) {
        log.error("Failed to toggle theme:", err);
      }
    });
  });
}

function renderDeveloperTab(container: HTMLElement): void {
  const { SettingsStorage } = require("../utils/storage");
  const settings = SettingsStorage.get();

  container.innerHTML = `
    <div class="cadixmod-settings-section">
      <h3>Developer Settings</h3>
      <p>Advanced options for plugin developers.</p>
      <div class="cadixmod-setting-row">
        <div>
          <div class="cadixmod-setting-label">Verbose Logging</div>
          <div class="cadixmod-setting-description">Enable debug-level log output</div>
        </div>
        <label class="cadixmod-toggle">
          <input type="checkbox" data-dev-setting="verboseLogging" ${settings.developer.verboseLogging ? "checked" : ""}>
          <span class="cadixmod-toggle-slider"></span>
        </label>
      </div>
      <div class="cadixmod-setting-row">
        <div>
          <div class="cadixmod-setting-label">Inspect Element</div>
          <div class="cadixmod-setting-description">Show inspect element in context menu</div>
        </div>
        <label class="cadixmod-toggle">
          <input type="checkbox" data-dev-setting="inspectElement" ${settings.developer.inspectElement ? "checked" : ""}>
          <span class="cadixmod-toggle-slider"></span>
        </label>
      </div>
      <div class="cadixmod-setting-row">
        <div>
          <div class="cadixmod-setting-label">Reset All Settings</div>
          <div class="cadixmod-setting-description">Restore default settings</div>
        </div>
        <button class="cadixmod-modal-btn cadixmod-modal-btn-danger" id="cadixmod-reset-settings">Reset</button>
      </div>
    </div>
  `;

  container.querySelectorAll("input[data-dev-setting]").forEach((input) => {
    input.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const key = target.dataset.devSetting;
      if (!key) return;
      (settings.developer as Record<string, boolean>)[key] = target.checked;
      SettingsStorage.set(settings);
    });
  });

  const resetBtn = container.querySelector("#cadixmod-reset-settings");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      showModal({
        title: "Reset Settings",
        content: "Are you sure you want to reset all settings to defaults? This cannot be undone.",
        buttons: [
          { label: "Cancel", style: "secondary", onClick: () => {} },
          {
            label: "Reset",
            style: "danger",
            onClick: () => {
              SettingsStorage.reset();
              container.innerHTML = "";
              renderDeveloperTab(container);
            },
          },
        ],
      });
    });
  }
}

export function createSettingsPanel(): void {
  if (document.getElementById(SETTINGS_BUTTON_ID)) return;

  const button = document.createElement("button");
  button.id = SETTINGS_BUTTON_ID;
  button.innerHTML = SETTINGS_SVG;
  button.title = "CadixMod Settings";
  button.addEventListener("click", openSettings);
  document.body.appendChild(button);
}

function openSettings(): void {
  const existing = document.querySelector(`.${SETTINGS_OVERLAY_CLASS}`);
  if (existing) existing.remove();

  settingsTabs = getDefaultTabs();

  const overlay = document.createElement("div");
  overlay.className = SETTINGS_OVERLAY_CLASS;

  const panel = document.createElement("div");
  panel.className = "cadixmod-settings-panel";

  panel.innerHTML = `
    <div class="cadixmod-settings-header">
      <h2>
        <span class="cadixmod-logo">C</span>
        CadixMod Settings
        <span style="font-size: 12px; color: #80848e; font-weight: 400;">v${CADIXMOD_VERSION}</span>
      </h2>
      <button class="cadixmod-settings-close">${CLOSE_SVG}</button>
    </div>
    <div class="cadixmod-settings-body">
      <div class="cadixmod-settings-sidebar">
        ${settingsTabs
          .map(
            (tab) => `
          <div class="cadixmod-settings-nav-item ${tab.id === activeTabId ? "active" : ""}" data-tab="${tab.id}">
            <span>${tab.icon}</span>
            <span>${tab.label}</span>
          </div>
        `
          )
          .join("")}
      </div>
      <div class="cadixmod-settings-content" id="cadixmod-settings-content"></div>
    </div>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  const closeBtn = panel.querySelector(".cadixmod-settings-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => overlay.remove());
  }

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  panel.querySelectorAll(".cadixmod-settings-nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const tabId = (item as HTMLElement).dataset.tab;
      if (!tabId) return;
      activeTabId = tabId;

      panel.querySelectorAll(".cadixmod-settings-nav-item").forEach((el) => {
        el.classList.remove("active");
      });
      item.classList.add("active");

      const content = panel.querySelector("#cadixmod-settings-content") as HTMLElement;
      if (content) {
        const tab = settingsTabs.find((t) => t.id === tabId);
        if (tab) {
          content.innerHTML = "";
          tab.render(content);
        }
      }
    });
  });

  const content = panel.querySelector("#cadixmod-settings-content") as HTMLElement;
  if (content) {
    const tab = settingsTabs.find((t) => t.id === activeTabId);
    if (tab) {
      tab.render(content);
    }
  }
}

export function removeSettingsButton(): void {
  const btn = document.getElementById(SETTINGS_BUTTON_ID);
  if (btn) btn.remove();
}

function ensureToastContainer(): HTMLElement {
  let container = document.getElementById(TOAST_CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = TOAST_CONTAINER_ID;
    container.className = "cadixmod-toast-container";
    document.body.appendChild(container);
  }
  return container;
}

const TOAST_ICONS: Record<string, string> = {
  info: "\u2139\uFE0F",
  success: "\u2705",
  warning: "\u26A0\uFE0F",
  error: "\u274C",
};

export function showToast(options: ToastOptions): HTMLElement {
  const container = ensureToastContainer();

  const toast = document.createElement("div");
  toast.className = `cadixmod-toast cadixmod-toast-${options.type ?? "info"}`;

  const icon = TOAST_ICONS[options.type ?? "info"] ?? TOAST_ICONS.info;

  toast.innerHTML = `
    <div class="cadixmod-toast-icon">${icon}</div>
    <div class="cadixmod-toast-body">
      <div class="cadixmod-toast-title">${escapeHtml(options.title)}</div>
      ${options.content ? `<div class="cadixmod-toast-content">${escapeHtml(options.content)}</div>` : ""}
    </div>
    <button class="cadixmod-toast-close">${CLOSE_SVG}</button>
  `;

  const closeBtn = toast.querySelector(".cadixmod-toast-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => removeToast(toast));
  }

  if (options.onClick) {
    toast.style.cursor = "pointer";
    toast.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest(".cadixmod-toast-close")) return;
      options.onClick!();
    });
  }

  container.appendChild(toast);

  const duration = options.duration ?? 5000;
  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }

  return toast;
}

function removeToast(toast: HTMLElement): void {
  toast.classList.add("cadixmod-toast-exiting");
  setTimeout(() => toast.remove(), 200);
}

export function showModal(options: ModalOptions): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = MODAL_OVERLAY_CLASS;

  const modal = document.createElement("div");
  modal.className = "cadixmod-modal";

  const buttons = options.buttons ?? [{ label: "OK", style: "primary", onClick: () => {} }];

  modal.innerHTML = `
    <div class="cadixmod-modal-header">
      <h3>${escapeHtml(options.title)}</h3>
    </div>
    <div class="cadixmod-modal-body">${options.content}</div>
    <div class="cadixmod-modal-footer">
      ${buttons
        .map(
          (btn, i) =>
            `<button class="cadixmod-modal-btn cadixmod-modal-btn-${btn.style ?? "primary"}" data-modal-btn="${i}">${escapeHtml(btn.label)}</button>`
        )
        .join("")}
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  modal.querySelectorAll("button[data-modal-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt((btn as HTMLElement).dataset.modalBtn ?? "0", 10);
      if (buttons[idx]) {
        buttons[idx].onClick();
      }
      overlay.remove();
      if (options.onClose) options.onClose();
    });
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      if (options.onClose) options.onClose();
    }
  });

  return overlay;
}

export function createNavItem(options: NavItem): HTMLElement {
  const item = document.createElement("div");
  item.className = `cadixmod-nav-item ${options.active ? "active" : ""}`;
  item.dataset.navId = options.id;
  item.title = options.label;

  item.innerHTML = `
    <div class="cadixmod-nav-pill"></div>
    <span>${options.icon}</span>
    ${options.badge && options.badge > 0 ? `<div class="cadixmod-nav-badge">${options.badge}</div>` : ""}
  `;

  item.addEventListener("click", () => {
    options.onClick();
  });

  return item;
}

export function removeModal(overlay: HTMLElement): void {
  overlay.remove();
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

export { SettingsTab, activeTabId, settingsTabs };
