import { CadixSettings, LogLevel } from "./types";

export const CADIXMOD_VERSION = "1.0.0";

export const CADIXMOD_NAME = "CadixMod";

export const CADIXMOD_AUTHOR = "CadixMod Team";

export const IPC_CHANNELS = {
  CADIX_READY: "cadix:ready",
  CADIX_SETTINGS: "cadix:settings",
  CADIX_THEMES: "cadix:themes",
  CADIX_PLUGINS: "cadix:plugins",
  CADIX_ERROR: "cadix:error",
  CADIX_LOG: "cadix:log",
  CADIX_INJECT: "cadix:inject",
  CADIX_THEME_UPDATE: "cadix:theme-update",
  CADIX_PLUGIN_UPDATE: "cadix:plugin-update",
  CADIX_RELOAD: "cadix:reload",
} as const;

export const STORAGE_KEYS = {
  SETTINGS: "cadixmod_settings",
  PLUGINS: "cadixmod_plugins",
  THEMES: "cadixmod_themes",
  PLUGIN_CONFIGS: "cadixmod_plugin_configs",
  THEME_CONFIGS: "cadixmod_theme_configs",
  FIRST_RUN: "cadixmod_first_run",
  LAST_VERSION: "cadixmod_last_version",
} as const;

export const DEFAULT_SETTINGS: CadixSettings = {
  general: {
    enablePlugins: true,
    enableThemes: true,
    enableDevTools: false,
    debugMode: false,
    logLevel: LogLevel.INFO,
  },
  plugins: {},
  themes: {},
  ui: {
    showBadges: true,
    showToasts: true,
    compactMode: false,
    sidebarPosition: "left",
  },
  developer: {
    reactDevTools: false,
    inspectElement: false,
    verboseLogging: false,
  },
};

export const LOG_LEVELS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
  [LogLevel.SILENT]: "SILENT",
};

export const LOG_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "#8B8B8B",
  [LogLevel.INFO]: "#00B0F4",
  [LogLevel.WARN]: "#FFD700",
  [LogLevel.ERROR]: "#FF4444",
  [LogLevel.SILENT]: "#000000",
};

export const CSS_SELECTORS = {
  APP_CONTAINER: "#app-mount",
  GUILD_SIDEBAR: '.guilds__list, [class*="guilds"]',
  CHANNEL_SIDEBAR: '[class*="channels"], [class*="channel"]',
  CHAT_AREA: '[class*="chatContent"], [class*="message-content"]',
  SETTINGS_PANEL: '[class*="settings"], [class*="modal"]',
  USER_AREA: '[class*="account"], [class*="userArea"]',
  TOAST_CONTAINER: '[class*="toasts"], [class*="notification"]',
} as const;

export const DISCORD_SELECTORS = {
  APP_MOUNT: "#app-mount",
  REACT_ROOT: "#app-mount > div",
  GUILD_LIST: ".guilds__list",
  CHANNEL_LIST: '[class*="channels__list"]',
  CHAT_CONTENT: '[class*="chatContent"]',
  MESSAGE_INPUT: '[class*="messageContent"] textarea, [class*="channelTextArea"] textarea',
  SETTINGS_MODAL: '[class*="modal-"]',
  MODAL_BODY: '[class*="modalBody-"]',
} as const;

export const PATCH_DEFAULTS = {
  DEFAULT_PRIORITY: 50,
  MAX_PRIORITY: 0,
  MIN_PRIORITY: 100,
} as const;

export const THEME_DEFAULTS = {
  DEFAULT_THEME: "CadixMod Default",
  THEME_EXTENSIONS: [".css", ".scss", ".less"],
  CUSTOM_PROPERTY_PREFIX: "--cadix-",
} as const;
