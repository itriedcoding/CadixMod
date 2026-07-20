// CadixMod Renderer Entry - Injects into Discord's renderer process

import { pluginManager } from "../api/plugin";
import { discordAPI } from "../api/discord";
import { patcher } from "../api/patcher";
import { storage } from "../utils/storage";
import { logger } from "../utils/logger";
import { injectSettingsButton, removeSettingsButton } from "./settings";
import { injectCSS, removeCSS } from "./css";

class CadixModRenderer {
  private static instance: CadixModRenderer;
  private initialized = false;

  static getInstance(): CadixModRenderer {
    if (!CadixModRenderer.instance) {
      CadixModRenderer.instance = new CadixModRenderer();
    }
    return CadixModRenderer.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    logger.info("Initializing renderer...");

    try {
      await discordAPI.initialize();
      await pluginManager.initialize();

      injectSettingsButton();
      this.injectBadge();

      logger.info("CadixMod loaded successfully!");
      this.initialized = true;
    } catch (err) {
      logger.error("Failed to initialize CadixMod:", err);
    }
  }

  private injectBadge(): void {
    const observer = new MutationObserver(() => {
      const titleElement = document.querySelector(".title-31JmR4");
      if (titleElement && !document.querySelector(".cadixmod-badge")) {
        const badge = document.createElement("span");
        badge.className = "cadixmod-badge";
        badge.textContent = "CadixMod";
        badge.style.cssText = `
          background: linear-gradient(135deg, #7289da, #5b6eae);
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          margin-left: 8px;
          vertical-align: middle;
        `;
        titleElement.appendChild(badge);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  destroy(): void {
    removeSettingsButton();
    removeCSS();
    patcher.unpatchAll();

    for (const plugin of pluginManager.getAll()) {
      pluginManager.disable(plugin.name);
    }

    this.initialized = false;
    logger.info("CadixMod unloaded");
  }
}

declare global {
  interface Window {
    CadixMod: any;
    webpackChunkdiscord_app: any[];
  }
}

const cadixmod = CadixModRenderer.getInstance();
cadixmod.initialize();

export default cadixmod;
