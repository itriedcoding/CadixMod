import { createLogger } from "../utils/logger";
import { CADIXMOD_VERSION, CADIXMOD_NAME } from "../shared/constants";
import { SettingsStorage, VersionStorage } from "../utils/storage";
import { LogLevel } from "../shared/types";
import { injectStyles, removeStyles } from "./css";
import { Webpack } from "./webpack";
import { Patcher } from "./patcher";
import { Discord } from "./discord";
import { Themes } from "./themes";
import { Plugins } from "./plugins";
import { createSettingsPanel, removeSettingsButton, showToast } from "./ui";

const log = createLogger("Core", "#5865F2");

class CadixModCore {
  private initialized = false;
  private waitForDiscord(maxAttempts = 60, interval = 1000): Promise<boolean> {
    return new Promise((resolve) => {
      let attempts = 0;
      const check = () => {
        attempts++;
        const appMount = document.querySelector("#app-mount");
        if (appMount) {
          log.info("Discord app mount found");
          resolve(true);
          return;
        }
        if (attempts >= maxAttempts) {
          log.error("Timed out waiting for Discord to load");
          resolve(false);
          return;
        }
        setTimeout(check, interval);
      };
      check();
    });
  }

  async init(): Promise<void> {
    if (this.initialized) {
      log.warn("CadixMod already initialized");
      return;
    }

    log.info(`${CADIXMOD_NAME} v${CADIXMOD_VERSION} initializing...`);

    const loaded = await this.waitForDiscord();
    if (!loaded) {
      log.error("Failed to detect Discord, aborting initialization");
      return;
    }

    try {
      injectStyles();
      log.debug("Injected CadixMod styles");
    } catch (err) {
      log.error("Failed to inject styles:", err);
    }

    try {
      await Webpack.init();
      log.debug("Webpack interceptor initialized");
    } catch (err) {
      log.error("Failed to initialize Webpack:", err);
    }

    try {
      Patcher.init();
      log.debug("Patcher initialized");
    } catch (err) {
      log.error("Failed to initialize Patcher:", err);
    }

    try {
      Discord.init();
      log.debug("Discord API initialized");
    } catch (err) {
      log.error("Failed to initialize Discord API:", err);
    }

    try {
      Themes.init();
      log.debug("Theme engine initialized");
    } catch (err) {
      log.error("Failed to initialize Theme engine:", err);
    }

    try {
      Plugins.init();
      log.debug("Plugin manager initialized");
    } catch (err) {
      log.error("Failed to initialize Plugin manager:", err);
    }

    try {
      createSettingsPanel();
      log.debug("Settings panel injected");
    } catch (err) {
      log.error("Failed to inject settings panel:", err);
    }

    this.setupLog();

    const isFirstRun = VersionStorage.isFirstRun();
    const lastVersion = VersionStorage.getLastVersion();

    VersionStorage.setLastVersion(CADIXMOD_VERSION);
    VersionStorage.setFirstRun(false);

    this.initialized = true;
    log.info(`${CADIXMOD_NAME} v${CADIXMOD_VERSION} initialized successfully`);

    try {
      const { showToasts } = SettingsStorage.get();
      if (showToasts) {
        if (isFirstRun) {
          showToast({
            title: `Welcome to ${CADIXMOD_NAME}!`,
            content: `Version ${CADIXMOD_VERSION} has been installed. Click the settings button to configure.`,
            type: "success",
            duration: 8000,
          });
        } else if (lastVersion && lastVersion !== CADIXMOD_VERSION) {
          showToast({
            title: `${CADIXMOD_NAME} Updated`,
            content: `Updated from v${lastVersion} to v${CADIXMOD_VERSION}`,
            type: "info",
            duration: 5000,
          });
        } else {
          showToast({
            title: `${CADIXMOD_NAME} Loaded`,
            content: `Version ${CADIXMOD_VERSION} is running`,
            type: "info",
            duration: 3000,
          });
        }
      }
    } catch (err) {
      log.error("Failed to show welcome toast:", err);
    }
  }

  private setupLog(): void {
    const level = SettingsStorage.getGeneral("logLevel");
    log.setLevel(level);
  }

  destroy(): void {
    if (!this.initialized) return;

    log.info(`${CADIXMOD_NAME} shutting down...`);

    Plugins.cleanup();
    Themes.cleanup();
    Patcher.cleanup();
    removeSettingsButton();
    removeStyles();
    Webpack.invalidate();

    this.initialized = false;
    log.info(`${CADIXMOD_NAME} shut down`);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getVersion(): string {
    return CADIXMOD_VERSION;
  }

  async reinit(): Promise<void> {
    this.destroy();
    await this.init();
  }
}

const CadixMod = new CadixModCore();

export { CadixMod, CadixModCore };
export default CadixMod;

if (typeof window !== "undefined") {
  (window as Record<string, unknown>).CadixMod = CadixMod;
}

CadixMod.init().catch((err) => {
  console.error("[CadixMod] Fatal initialization error:", err);
});
