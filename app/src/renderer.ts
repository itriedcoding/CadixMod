let currentPage = "home";
let currentSettings = {};
let discordInstallations = [];

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".sidebar-item").forEach((s) => s.classList.remove("active"));

  document.getElementById("page-" + page)?.classList.add("active");
  document.querySelector(`[data-page="${page}"]`)?.classList.add("active");

  const titles = {
    home: ["Home", "Manage your Discord mod"],
    discord: ["Discord", "View and manage Discord installations"],
    settings: ["Settings", "Configure CadixMod preferences"],
    logs: ["Logs", "Application debug logs"],
  };

  const [title, desc] = titles[page] || ["", ""];
  document.getElementById("main-header").innerHTML = `<h1>${title}</h1><p>${desc}</p>`;
}

function addLog(message, type = "info") {
  const logOutput = document.getElementById("log-output");
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  const line = document.createElement("div");
  line.className = "log-line log-" + type;
  line.textContent = `[${time}] ${message}`;
  logOutput.appendChild(line);
  logOutput.scrollTop = logOutput.scrollHeight;
}

function clearLogs() {
  document.getElementById("log-output").innerHTML = "";
  addLog("Logs cleared", "info");
}

async function loadSettings() {
  try {
    currentSettings = await window.api.settings.get();
    document.getElementById("setting-autoInject").checked = currentSettings.autoInject;
    document.getElementById("setting-autoStartDiscord").checked = currentSettings.autoStartDiscord;
    document.getElementById("setting-launchOnStartup").checked = currentSettings.launchOnStartup;
    document.getElementById("setting-minimizeToTray").checked = currentSettings.minimizeToTray;
    document.getElementById("setting-closeToTray").checked = currentSettings.closeToTray;
  } catch (e) {
    addLog("Failed to load settings: " + e.message, "error");
  }
}

async function updateSetting(key, value) {
  currentSettings[key] = value;
  await window.api.settings.set({ [key]: value });
  addLog(`Setting updated: ${key} = ${value}`, "info");
}

async function refreshDiscord() {
  const list = document.getElementById("discord-list");
  list.innerHTML = '<div class="empty-state"><div class="loading"></div><p>Scanning for Discord installations...</p></div>';

  try {
    discordInstallations = await window.api.discord.detect();
    renderDiscordList();
  } catch (e) {
    addLog("Failed to detect Discord: " + e.message, "error");
    list.innerHTML = '<div class="empty-state"><div class="icon">❌</div><p>Failed to scan for Discord</p></div>';
  }
}

function renderDiscordList() {
  const list = document.getElementById("discord-list");

  if (discordInstallations.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>No Discord installations found</p><p style="font-size:11px;margin-top:4px;color:#444">Please install Discord first</p></div>';
    document.getElementById("installations-count").textContent = "0 installations found";
    return;
  }

  document.getElementById("installations-count").textContent = discordInstallations.length + " installation" + (discordInstallations.length !== 1 ? "s" : "") + " found";

  list.innerHTML = discordInstallations
    .map((inst) => {
      const badgeClass = inst.isPatched ? "badge-green" : "badge-yellow";
      const badgeText = inst.isPatched ? "Patched" : "Vanilla";
      const channelLabel = inst.channel.charAt(0).toUpperCase() + inst.channel.slice(1);

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
                ? `<button class="btn btn-danger" onclick="uninjectDiscord(${JSON.stringify(inst).replace(/"/g, "&quot;")})">Remove</button>`
                : `<button class="btn btn-success" onclick="injectDiscord(${JSON.stringify(inst).replace(/"/g, "&quot;")})">Inject</button>`
            }
            <button class="btn btn-secondary" onclick="launchDiscord(${JSON.stringify(inst).replace(/"/g, "&quot;")})">Launch</button>
          </div>
        </div>
      `;
    })
    .join("");
}

async function injectDiscord(inst) {
  addLog(`Injecting into ${inst.name}...`, "info");
  try {
    const result = await window.api.discord.inject(inst);
    if (result.success) {
      addLog(result.message, "info");
    } else {
      addLog("Injection failed: " + result.message, "error");
    }
    await refreshDiscord();
  } catch (e) {
    addLog("Injection error: " + e.message, "error");
  }
}

async function uninjectDiscord(inst) {
  addLog(`Removing from ${inst.name}...`, "info");
  try {
    const result = await window.api.discord.uninject(inst);
    if (result.success) {
      addLog(result.message, "info");
    } else {
      addLog("Removal failed: " + result.message, "error");
    }
    await refreshDiscord();
  } catch (e) {
    addLog("Removal error: " + e.message, "error");
  }
}

async function autoInject() {
  addLog("Auto-injecting into all Discord installations...", "info");
  try {
    await window.api.autoinject.run();
    addLog("Auto-inject complete", "info");
    await refreshDiscord();
  } catch (e) {
    addLog("Auto-inject failed: " + e.message, "error");
  }
}

async function uninjectAll() {
  addLog("Removing from all Discord installations...", "info");
  try {
    await window.api.autoinject.remove();
    addLog("Removal complete", "info");
    await refreshDiscord();
  } catch (e) {
    addLog("Removal failed: " + e.message, "error");
  }
}

async function launchDiscord(inst) {
  addLog(`Launching ${inst.name}...`, "info");
  try {
    await window.api.discord.launch(inst);
  } catch (e) {
    addLog("Launch failed: " + e.message, "error");
  }
}

async function updateDiscordStatus() {
  try {
    const running = await window.api.discord.isRunning();
    const dot = document.getElementById("discord-status-dot");
    const text = document.getElementById("discord-status-text");

    if (running) {
      dot.className = "status-dot online";
      text.textContent = "Discord is running";
    } else {
      dot.className = "status-dot offline";
      text.textContent = "Discord is not running";
    }
  } catch {}
}

document.querySelectorAll(".sidebar-item").forEach((item) => {
  item.addEventListener("click", () => {
    const page = item.dataset.page;
    if (page) navigateTo(page);
  });
});

window.api.discord.onStatus((data) => {
  const dot = document.getElementById("discord-status-dot");
  const text = document.getElementById("discord-status-text");

  if (data.running) {
    dot.className = "status-dot online";
    text.textContent = "Discord is running";
  } else {
    dot.className = "status-dot offline";
    text.textContent = "Discord is not running";
  }

  if (data.installations) {
    discordInstallations = data.installations;
    if (currentPage === "discord") {
      renderDiscordList();
    }
    document.getElementById("installations-count").textContent =
      discordInstallations.length + " installation" + (discordInstallations.length !== 1 ? "s" : "") + " found";
  }
});

async function init() {
  await loadSettings();
  await refreshDiscord();
  updateDiscordStatus();
  setInterval(updateDiscordStatus, 5000);
  addLog("CadixMod Desktop ready", "info");
}

init();
