let currentPage = "home";
let currentSettings: any = {};
let discordInstallations: any[] = [];
let plugins: any[] = [];
let themes: any[] = [];
let editingThemeName = "";

function navigateTo(page: string): void {
  currentPage = page;
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".sidebar-item").forEach((s) => s.classList.remove("active"));

  const pageEl = document.getElementById("page-" + page);
  if (pageEl) pageEl.classList.add("active");

  const sidebarItem = document.querySelector(`[data-page="${page}"]`);
  if (sidebarItem) sidebarItem.classList.add("active");

  const titles: Record<string, [string, string]> = {
    home: ["Home", "Manage your Discord mod"],
    discord: ["Discord", "View and manage Discord installations"],
    plugins: ["Plugins", "Manage your installed plugins"],
    themes: ["Themes", "Manage your installed themes"],
    settings: ["Settings", "Configure CadixMod preferences"],
    logs: ["Logs", "Application debug logs"],
  };

  const [title, desc] = titles[page] || ["", ""];
  const header = document.getElementById("main-header");
  if (header) header.innerHTML = `<h1>${title}</h1><p>${desc}</p>`;

  if (page === "plugins") loadPlugins();
  if (page === "themes") loadThemes();
  if (page === "discord") refreshDiscord();
}

function addLog(message: string, type: string = "info"): void {
  const logOutput = document.getElementById("log-output");
  if (!logOutput) return;
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  const line = document.createElement("div");
  line.className = "log-line log-" + type;
  line.textContent = `[${time}] ${message}`;
  logOutput.appendChild(line);
  logOutput.scrollTop = logOutput.scrollHeight;
}

function clearLogs(): void {
  const logOutput = document.getElementById("log-output");
  if (logOutput) logOutput.innerHTML = "";
  addLog("Logs cleared", "info");
}

async function loadSettings(): Promise<void> {
  try {
    currentSettings = await window.api.settings.get();
    const autoInjectEl = document.getElementById("setting-autoInject") as HTMLInputElement;
    const autoStartEl = document.getElementById("setting-autoStartDiscord") as HTMLInputElement;
    const launchEl = document.getElementById("setting-launchOnStartup") as HTMLInputElement;
    const minEl = document.getElementById("setting-minimizeToTray") as HTMLInputElement;
    const closeEl = document.getElementById("setting-closeToTray") as HTMLInputElement;

    if (autoInjectEl) autoInjectEl.checked = currentSettings.autoInject;
    if (autoStartEl) autoStartEl.checked = currentSettings.autoStartDiscord;
    if (launchEl) launchEl.checked = currentSettings.launchOnStartup;
    if (minEl) minEl.checked = currentSettings.minimizeToTray;
    if (closeEl) closeEl.checked = currentSettings.closeToTray;
  } catch (e: any) {
    addLog("Failed to load settings: " + e.message, "error");
  }
}

async function updateSetting(key: string, value: any): Promise<void> {
  currentSettings[key] = value;
  await window.api.settings.set({ [key]: value });
  addLog(`Setting updated: ${key} = ${value}`, "info");
}

async function refreshDiscord(): Promise<void> {
  const list = document.getElementById("discord-list");
  if (!list) return;
  list.innerHTML =
    '<div class="empty-state"><div class="loading"></div><p>Scanning for Discord installations...</p></div>';

  try {
    discordInstallations = await window.api.discord.detect();
    renderDiscordList();
  } catch (e: any) {
    addLog("Failed to detect Discord: " + e.message, "error");
    list.innerHTML =
      '<div class="empty-state"><div class="icon">❌</div><p>Failed to scan for Discord</p></div>';
  }
}

function renderDiscordList(): void {
  const list = document.getElementById("discord-list");
  if (!list) return;

  if (discordInstallations.length === 0) {
    list.innerHTML =
      '<div class="empty-state"><div class="icon">🔍</div><p>No Discord installations found</p><p style="font-size:11px;margin-top:4px;color:#444">Please install Discord first</p></div>';
    const countEl = document.getElementById("installations-count");
    if (countEl) countEl.textContent = "0 installations found";
    return;
  }

  const countEl = document.getElementById("installations-count");
  if (countEl) {
    countEl.textContent =
      discordInstallations.length +
      " installation" +
      (discordInstallations.length !== 1 ? "s" : "") +
      " found";
  }

  list.innerHTML = discordInstallations
    .map((inst) => {
      const badgeClass = inst.isPatched ? "badge-green" : "badge-yellow";
      const badgeText = inst.isPatched ? "Patched" : "Vanilla";
      const channelLabel =
        inst.channel.charAt(0).toUpperCase() + inst.channel.slice(1);
      const escapedInst = JSON.stringify(inst)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      return `
        <div class="card discord-card" style="margin-bottom:12px">
          <div class="discord-info">
            <div class="discord-icon">🎮</div>
            <div>
              <div class="discord-name">${inst.name} <span class="badge badge-blue">${channelLabel}</span></div>
              <div class="discord-path">${inst.path}</div>
              <div class="discord-status">
                <span class="badge ${badgeClass}">${badgeText}</span>
                ${inst.version !== "unknown" ? " v" + inst.version : ""}
              </div>
            </div>
          </div>
          <div class="discord-actions">
            ${
              inst.isPatched
                ? `<button class="btn btn-danger" onclick="uninjectDiscord(JSON.parse(this.dataset.inst))" data-inst='${escapedInst}'>Remove</button>`
                : `<button class="btn btn-success" onclick="injectDiscord(JSON.parse(this.dataset.inst))" data-inst='${escapedInst}'>Inject</button>`
            }
            <button class="btn btn-secondary" onclick="launchDiscord(JSON.parse(this.dataset.inst))" data-inst='${escapedInst}'>Launch</button>
          </div>
        </div>
      `;
    })
    .join("");
}

async function injectDiscord(inst: any): Promise<void> {
  addLog(`Injecting into ${inst.name}...`, "info");
  try {
    const result = await window.api.discord.inject(inst);
    if (result.success) {
      addLog(result.message, "info");
    } else {
      addLog("Injection failed: " + result.message, "error");
    }
    await refreshDiscord();
  } catch (e: any) {
    addLog("Injection error: " + e.message, "error");
  }
}

async function uninjectDiscord(inst: any): Promise<void> {
  addLog(`Removing from ${inst.name}...`, "info");
  try {
    const result = await window.api.discord.uninject(inst);
    if (result.success) {
      addLog(result.message, "info");
    } else {
      addLog("Removal failed: " + result.message, "error");
    }
    await refreshDiscord();
  } catch (e: any) {
    addLog("Removal error: " + e.message, "error");
  }
}

async function autoInject(): Promise<void> {
  addLog("Auto-injecting into all Discord installations...", "info");
  try {
    await window.api.autoinject.run();
    addLog("Auto-inject complete", "info");
    await refreshDiscord();
  } catch (e: any) {
    addLog("Auto-inject failed: " + e.message, "error");
  }
}

async function uninjectAll(): Promise<void> {
  addLog("Removing from all Discord installations...", "info");
  try {
    await window.api.autoinject.remove();
    addLog("Removal complete", "info");
    await refreshDiscord();
  } catch (e: any) {
    addLog("Removal failed: " + e.message, "error");
  }
}

async function launchDiscord(inst: any): Promise<void> {
  addLog(`Launching ${inst.name}...`, "info");
  try {
    await window.api.discord.launch(inst);
  } catch (e: any) {
    addLog("Launch failed: " + e.message, "error");
  }
}

async function updateDiscordStatus(): Promise<void> {
  try {
    const running = await window.api.discord.isRunning();
    const dot = document.getElementById("discord-status-dot");
    const text = document.getElementById("discord-status-text");

    if (running) {
      if (dot) dot.className = "status-dot online";
      if (text) text.textContent = "Discord is running";
    } else {
      if (dot) dot.className = "status-dot offline";
      if (text) text.textContent = "Discord is not running";
    }
  } catch {}
}

async function loadPlugins(): Promise<void> {
  try {
    plugins = await window.api.plugins.get();
    renderPlugins();
  } catch (e: any) {
    addLog("Failed to load plugins: " + e.message, "error");
    plugins = [];
    renderPlugins();
  }
}

function renderPlugins(filter?: string): void {
  const grid = document.getElementById("plugin-grid");
  if (!grid) return;

  let list = plugins;
  if (filter) {
    const lower = filter.toLowerCase();
    list = plugins.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower) ||
        p.author.toLowerCase().includes(lower)
    );
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="icon">🧩</div>
        <p>${filter ? "No plugins match your search" : "No plugins installed"}</p>
        <p style="font-size:11px;margin-top:4px;color:#444">
          ${filter ? "Try a different search term" : "Click Install to add your first plugin"}
        </p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list
    .map(
      (p) => `
    <div class="plugin-card" data-name="${p.name}">
      <div class="plugin-card-header">
        <div>
          <div class="plugin-name">${p.name}</div>
          <div class="plugin-version">v${p.version}</div>
        </div>
        <label class="toggle">
          <input type="checkbox" ${p.enabled ? "checked" : ""} onchange="togglePlugin('${p.name}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="plugin-desc">${p.description || "No description"}</div>
      <div class="plugin-author">by ${p.author}</div>
    </div>
  `
    )
    .join("");
}

function filterPlugins(value: string): void {
  renderPlugins(value);
}

async function togglePlugin(name: string, enabled: boolean): Promise<void> {
  try {
    if (enabled) {
      await window.api.plugins.enable(name);
      addLog(`Plugin enabled: ${name}`, "info");
    } else {
      await window.api.plugins.disable(name);
      addLog(`Plugin disabled: ${name}`, "info");
    }
    plugins = await window.api.plugins.get();
  } catch (e: any) {
    addLog(`Failed to toggle plugin ${name}: ${e.message}`, "error");
  }
}

function openInstallPluginModal(): void {
  const nameInput = document.getElementById("modal-plugin-name") as HTMLInputElement;
  const codeInput = document.getElementById("modal-plugin-code") as HTMLTextAreaElement;
  if (nameInput) nameInput.value = "";
  if (codeInput) codeInput.value = "";
  openModal("modal-install-plugin");
}

async function installPluginFromCode(): Promise<void> {
  const nameInput = document.getElementById("modal-plugin-name") as HTMLInputElement;
  const codeInput = document.getElementById("modal-plugin-code") as HTMLTextAreaElement;

  const name = nameInput?.value?.trim();
  const code = codeInput?.value?.trim();

  if (!name) {
    addLog("Plugin name is required", "error");
    return;
  }

  if (!code) {
    addLog("Plugin code is required", "error");
    return;
  }

  try {
    const manifest = {
      name: name,
      description: "Installed from desktop app",
      version: "1.0.0",
      author: "User",
      enabled: true,
      main: "index.js",
    };

    await window.api.plugins.writeFile(name, "manifest.json", JSON.stringify(manifest, null, 2));
    await window.api.plugins.writeFile(name, "index.js", code);

    addLog(`Plugin installed: ${name}`, "info");
    closeModal("modal-install-plugin");
    await loadPlugins();
  } catch (e: any) {
    addLog("Failed to install plugin: " + e.message, "error");
  }
}

async function loadThemes(): Promise<void> {
  try {
    themes = await window.api.themes.get();
    renderThemes();
  } catch (e: any) {
    addLog("Failed to load themes: " + e.message, "error");
    themes = [];
    renderThemes();
  }
}

function renderThemes(filter?: string): void {
  const grid = document.getElementById("theme-grid");
  if (!grid) return;

  let list = themes;
  if (filter) {
    const lower = filter.toLowerCase();
    list = themes.filter(
      (t) =>
        t.name.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower) ||
        t.author.toLowerCase().includes(lower)
    );
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="icon">🎨</div>
        <p>${filter ? "No themes match your search" : "No themes installed"}</p>
        <p style="font-size:11px;margin-top:4px;color:#444">
          ${filter ? "Try a different search term" : "Click Install to add your first theme"}
        </p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list
    .map((t) => {
      const colorSwatches = t.colors
        ? Object.entries(t.colors)
            .slice(0, 6)
            .map(
              ([key, val]) =>
                `<div class="theme-swatch" style="background:${val}" title="${key}: ${val}"></div>`
            )
            .join("")
        : "";
      return `
      <div class="theme-card">
        <div class="theme-card-header">
          <div>
            <div class="theme-name">${t.name}</div>
            <div class="theme-author">by ${t.author}</div>
          </div>
          <label class="toggle">
            <input type="checkbox" ${t.enabled ? "checked" : ""} onchange="toggleTheme('${t.name}', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="theme-desc">${t.description || "No description"}</div>
        ${colorSwatches ? `<div class="theme-preview">${colorSwatches}</div>` : ""}
        <button class="btn btn-secondary" onclick="openEditTheme('${t.name}')" style="width:100%;justify-content:center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit CSS
        </button>
      </div>
    `;
    })
    .join("");
}

function filterThemes(value: string): void {
  renderThemes(value);
}

async function toggleTheme(name: string, enabled: boolean): Promise<void> {
  try {
    const theme = themes.find((t) => t.name === name);
    if (theme) {
      theme.enabled = enabled;
      await window.api.themes.install(name, {
        author: theme.author,
        description: theme.description,
        enabled: enabled,
        colors: theme.colors,
        css: theme.css,
      });
      addLog(`Theme ${enabled ? "enabled" : "disabled"}: ${name}`, "info");
    }
  } catch (e: any) {
    addLog(`Failed to toggle theme ${name}: ${e.message}`, "error");
  }
}

function openInstallThemeModal(): void {
  const nameInput = document.getElementById("modal-theme-name") as HTMLInputElement;
  const authorInput = document.getElementById("modal-theme-author") as HTMLInputElement;
  const cssInput = document.getElementById("modal-theme-css") as HTMLTextAreaElement;
  if (nameInput) nameInput.value = "";
  if (authorInput) authorInput.value = "";
  if (cssInput) cssInput.value = "";
  openModal("modal-install-theme");
}

async function installThemeFromCode(): Promise<void> {
  const nameInput = document.getElementById("modal-theme-name") as HTMLInputElement;
  const authorInput = document.getElementById("modal-theme-author") as HTMLInputElement;
  const cssInput = document.getElementById("modal-theme-css") as HTMLTextAreaElement;

  const name = nameInput?.value?.trim();
  const author = authorInput?.value?.trim() || "User";
  const css = cssInput?.value?.trim();

  if (!name) {
    addLog("Theme name is required", "error");
    return;
  }

  if (!css) {
    addLog("Theme CSS is required", "error");
    return;
  }

  try {
    const colors = extractColorsFromCSS(css);

    await window.api.themes.install(name, {
      author: author,
      description: `Custom theme installed from desktop app`,
      enabled: true,
      colors: colors,
      css: css,
    });

    addLog(`Theme installed: ${name}`, "info");
    closeModal("modal-install-theme");
    await loadThemes();
  } catch (e: any) {
    addLog("Failed to install theme: " + e.message, "error");
  }
}

function extractColorsFromCSS(css: string): Record<string, string> {
  const colors: Record<string, string> = {};
  const colorRegex = /(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/g;
  let match: RegExpExecArray | null;
  while ((match = colorRegex.exec(css)) !== null) {
    colors[match[1]] = match[2];
  }
  if (Object.keys(colors).length === 0) {
    const simpleRegex = /(#[0-9a-fA-F]{6})\b/g;
    let idx = 0;
    while ((match = simpleRegex.exec(css)) !== null && idx < 6) {
      colors[`--color-${idx}`] = match[1];
      idx++;
    }
  }
  return colors;
}

function openEditTheme(name: string): void {
  editingThemeName = name;
  const theme = themes.find((t) => t.name === name);
  if (!theme) return;

  const titleEl = document.getElementById("edit-theme-title");
  const cssEl = document.getElementById("modal-edit-css") as HTMLTextAreaElement;
  if (titleEl) titleEl.textContent = name;
  if (cssEl) cssEl.value = theme.css || "";
  openModal("modal-edit-theme");
}

async function saveEditedTheme(): Promise<void> {
  if (!editingThemeName) return;
  const cssEl = document.getElementById("modal-edit-css") as HTMLTextAreaElement;
  const css = cssEl?.value || "";

  try {
    const theme = themes.find((t) => t.name === editingThemeName);
    const colors = extractColorsFromCSS(css);

    await window.api.themes.install(editingThemeName, {
      author: theme?.author || "Unknown",
      description: theme?.description || "",
      enabled: theme?.enabled || false,
      colors: colors,
      css: css,
    });

    addLog(`Theme saved: ${editingThemeName}`, "info");
    closeModal("modal-edit-theme");
    await loadThemes();
  } catch (e: any) {
    addLog("Failed to save theme: " + e.message, "error");
  }
}

async function deleteCurrentTheme(): Promise<void> {
  if (!editingThemeName) return;
  try {
    await window.api.themes.remove(editingThemeName);
    addLog(`Theme deleted: ${editingThemeName}`, "info");
    closeModal("modal-edit-theme");
    await loadThemes();
  } catch (e: any) {
    addLog("Failed to delete theme: " + e.message, "error");
  }
}

function openModal(id: string): void {
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function closeModal(id: string): void {
  const el = document.getElementById(id);
  if (el) el.classList.remove("active");
}

document.addEventListener("click", (e) => {
  if ((e.target as HTMLElement).classList.contains("modal-overlay")) {
    (e.target as HTMLElement).classList.remove("active");
  }
});

document.querySelectorAll(".sidebar-item").forEach((item) => {
  item.addEventListener("click", () => {
    const page = (item as HTMLElement).dataset.page;
    if (page) navigateTo(page);
  });
});

if (typeof window.api !== "undefined" && window.api.discord && window.api.discord.onStatus) {
  window.api.discord.onStatus((data: any) => {
    const dot = document.getElementById("discord-status-dot");
    const text = document.getElementById("discord-status-text");

    if (data.running) {
      if (dot) dot.className = "status-dot online";
      if (text) text.textContent = "Discord is running";
    } else {
      if (dot) dot.className = "status-dot offline";
      if (text) text.textContent = "Discord is not running";
    }

    if (data.installations) {
      discordInstallations = data.installations;
      if (currentPage === "discord") {
        renderDiscordList();
      }
      const countEl = document.getElementById("installations-count");
      if (countEl) {
        countEl.textContent =
          discordInstallations.length +
          " installation" +
          (discordInstallations.length !== 1 ? "s" : "") +
          " found";
      }
    }
  });
}

async function init(): Promise<void> {
  await loadSettings();
  await refreshDiscord();
  updateDiscordStatus();
  setInterval(updateDiscordStatus, 5000);
  addLog("CadixMod Desktop ready", "info");
}

init();
