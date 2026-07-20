// CadixMod Plugin: Better Folders
// Enhanced server folders with hover preview, unread counts, and collapse

import type { Plugin } from "../../shared/types";
import { logger } from "../../utils/logger";
import { Webpack } from "../../renderer/webpack";

const STYLE_ID = "cadixmod-better-folders-style";
const COLLAPSED_KEY = "cadixmod_folders_collapsed";

let observer: MutationObserver | null = null;
let patches: Array<{ unpatch: () => void }> = [];

function getCollapsedFolders(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSED_KEY) || "{}");
  } catch {
    return {};
  }
}

function setFolderCollapsed(folderId: string, collapsed: boolean): void {
  const data = getCollapsedFolders();
  data[folderId] = collapsed;
  localStorage.setItem(COLLAPSED_KEY, JSON.stringify(data));
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .cadixmod-folder-tooltip {
      position: fixed;
      background: #1e1f22;
      border: 1px solid #141517;
      border-radius: 8px;
      padding: 8px 12px;
      z-index: 100000;
      pointer-events: none;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      max-width: 220px;
      animation: cadixmod-fade-in 0.15s ease-out;
    }
    .cadixmod-folder-tooltip-name {
      color: #f2f3f5;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .cadixmod-folder-tooltip-servers {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .cadixmod-folder-tooltip-server {
      color: #b5bac1;
      font-size: 12px;
      padding: 2px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cadixmod-folder-unread-badge {
      position: absolute;
      bottom: -2px;
      right: -2px;
      background: #da373c;
      color: white;
      font-size: 9px;
      font-weight: 700;
      min-width: 14px;
      height: 14px;
      padding: 0 3px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 1;
    }
    .cadixmod-folder-collapse-btn {
      position: absolute;
      top: 50%;
      right: -4px;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #404249;
      border: 2px solid #1e1f22;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.15s, background 0.15s;
      z-index: 2;
    }
    .cadixmod-folder-collapse-btn:hover {
      background: #5865f2;
    }
    .cadixmod-folder-collapse-btn.collapsed {
      opacity: 1;
      background: #da373c;
    }
    .cadixmod-folder-servers-hidden {
      display: none !important;
    }
    .cadixmod-folder-header {
      position: relative;
    }
    .cadixmod-folder-header:hover .cadixmod-folder-collapse-btn {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
}

function removeStyles(): void {
  document.getElementById(STYLE_ID)?.remove();
}

function getGuildStore(): {
  getGuilds: () => Record<string, { id: string; name: string; icon: string | null }>;
  getGuild: (id: string) => { id: string; name: string; icon: string | null } | null;
} | null {
  const mod = Webpack.findByStoreName("GuildStore");
  if (!mod?.default) return null;
  try {
    return new (mod.default as new () => {
      getGuilds: () => Record<string, { id: string; name: string; icon: string | null }>;
      getGuild: (id: string) => { id: string; name: string; icon: string | null } | null;
    })();
  } catch {
    return null;
  }
}

function getGuildUnreadCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  try {
    const unreadModule = Webpack.findByProps("getUnreadGuildIds");
    if (unreadModule) {
      const getUnread = (unreadModule as Record<string, Function>).getUnreadGuildIds;
      if (typeof getUnread === "function") {
        const unreadIds = getUnread() as string[];
        if (Array.isArray(unreadIds)) {
          for (const id of unreadIds) {
            counts[id] = 1;
          }
        }
      }
    }
  } catch {
    // Unread store not available
  }
  return counts;
}

function getGuildFolders(): Array<{ id: string; name: string; guildIds: string[]; color: string | null }> {
  try {
    const folderModule = Webpack.findByProps("getSortedGuildFolders");
    if (folderModule) {
      const getFolders = (folderModule as Record<string, Function>).getSortedGuildFolders;
      if (typeof getFolders === "function") {
        return getFolders() as Array<{ id: string; name: string; guildIds: string[]; color: string | null }>;
      }
    }
  } catch {
    // Folder store not available
  }
  return [];
}

function createFolderTooltip(folder: { id: string; name: string; guildIds: string[] }, anchor: HTMLElement): HTMLElement {
  const tooltip = document.createElement("div");
  tooltip.className = "cadixmod-folder-tooltip";

  const guildStore = getGuildStore();
  const guilds = folder.guildIds
    .map((id) => guildStore?.getGuild(id))
    .filter((g): g is { id: string; name: string; icon: string | null } => g !== null);

  tooltip.innerHTML = `
    <div class="cadixmod-folder-tooltip-name">${escapeHTML(folder.name || "Server Folder")}</div>
    <div class="cadixmod-folder-tooltip-servers">
      ${guilds.map((g) => `<div class="cadixmod-folder-tooltip-server">${escapeHTML(g.name)}</div>`).join("")}
    </div>
  `;

  const rect = anchor.getBoundingClientRect();
  tooltip.style.left = `${rect.right + 8}px`;
  tooltip.style.top = `${rect.top}px`;

  return tooltip;
}

function escapeHTML(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function processFolders(): void {
  const collapsed = getCollapsedFolders();
  const folders = getGuildFolders();
  const unreadCounts = getGuildUnreadCounts();

  for (const folder of folders) {
    const folderElements = document.querySelectorAll(`[data-folder-id="${folder.id}"]`);
    for (const el of folderElements) {
      const folderEl = el as HTMLElement;

      let collapseBtn = folderEl.querySelector(".cadixmod-folder-collapse-btn") as HTMLElement;
      if (!collapseBtn) {
        collapseBtn = document.createElement("div");
        collapseBtn.className = `cadixmod-folder-collapse-btn ${collapsed[folder.id] ? "collapsed" : ""}`;
        collapseBtn.innerHTML = collapsed[folder.id] ? "+" : "\u2212";
        collapseBtn.title = collapsed[folder.id] ? "Expand folder" : "Collapse folder";

        collapseBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          const isCollapsed = !collapsed[folder.id];
          collapsed[folder.id] = isCollapsed;
          setFolderCollapsed(folder.id, isCollapsed);
          collapseBtn.className = `cadixmod-folder-collapse-btn ${isCollapsed ? "collapsed" : ""}`;
          collapseBtn.innerHTML = isCollapsed ? "+" : "\u2212";
          collapseBtn.title = isCollapsed ? "Expand folder" : "Collapse folder";

          const guildList = folderEl.querySelector("[class*='guilds']") as HTMLElement;
          if (guildList) {
            guildList.classList.toggle("cadixmod-folder-servers-hidden", isCollapsed);
          }
        });

        folderEl.style.position = "relative";
        folderEl.appendChild(collapseBtn);
      }

      const totalUnread = folder.guildIds.reduce((sum, gid) => sum + (unreadCounts[gid] || 0), 0);
      let badge = folderEl.querySelector(".cadixmod-folder-unread-badge") as HTMLElement;
      if (totalUnread > 0) {
        if (!badge) {
          badge = document.createElement("div");
          badge.className = "cadixmod-folder-unread-badge";
          folderEl.appendChild(badge);
        }
        badge.textContent = totalUnread > 99 ? "99+" : String(totalUnread);
      } else if (badge) {
        badge.remove();
      }

      let tooltip: HTMLElement | null = null;

      folderEl.addEventListener("mouseenter", () => {
        if (!tooltip) {
          tooltip = createFolderTooltip(folder, folderEl);
          document.body.appendChild(tooltip);
        }
      });

      folderEl.addEventListener("mouseleave", () => {
        if (tooltip) {
          tooltip.remove();
          tooltip = null;
        }
      });
    }
  }
}

const plugin: Plugin = {
  id: "betterfolders",
  name: "BetterFolders",
  description: "Enhanced server folders",
  version: "1.0.0",
  author: "CadixMod",
  patches: [],

  start() {
    logger.debug("BetterFolders started");

    injectStyles();

    const collapsed = getCollapsedFolders();
    for (const [folderId, isCollapsed] of Object.entries(collapsed)) {
      if (isCollapsed) {
        const folderElements = document.querySelectorAll(`[data-folder-id="${folderId}"]`);
        for (const el of folderElements) {
          const guildList = (el as HTMLElement).querySelector("[class*='guilds']") as HTMLElement;
          if (guildList) {
            guildList.classList.add("cadixmod-folder-servers-hidden");
          }
        }
      }
    }

    observer = new MutationObserver(() => {
      processFolders();
    });

    const appMount = document.querySelector("#app-mount");
    if (appMount) {
      observer.observe(appMount, { childList: true, subtree: true });
    }

    processFolders();
  },

  stop() {
    logger.debug("BetterFolders stopped");

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    document.querySelectorAll(".cadixmod-folder-tooltip, .cadixmod-folder-unread-badge, .cadixmod-folder-collapse-btn").forEach((el) => {
      el.remove();
    });

    document.querySelectorAll(".cadixmod-folder-servers-hidden").forEach((el) => {
      (el as HTMLElement).classList.remove("cadixmod-folder-servers-hidden");
    });

    removeStyles();
  },
};

export default plugin;
