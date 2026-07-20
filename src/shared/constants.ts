// CadixMod Constants

export const CADIXMOD_VERSION = "1.0.0";
export const CADIXMOD_NAME = "CadixMod";
export const CADIXMOD_DESCRIPTION = "A high-performance, cross-platform Discord client mod";

export const IPC_CHANNELS = {
  MAIN: "cadixmod:main",
  RENDERER: "cadixmod:renderer",
  PLUGIN: "cadixmod:plugin",
  SETTINGS: "cadixmod:settings",
  UPDATER: "cadixmod:updater",
  LOG: "cadixmod:log",
} as const;

export const DISCORD_PATHS: Record<string, string[]> = {
  win32: [
    "%LOCALAPPDATA%\\Discord",
    "%APPDATA%\\Discord",
  ],
  linux: [
    "~/.config/discord",
    "~/.local/share/Discord",
    "/usr/lib/discord",
    "/opt/Discord",
    "/snap/discord/current",
  ],
  darwin: [
    "/Applications/Discord.app/Contents/Resources",
    "~/Library/Application Support/discord",
  ],
} as const;

export const DISCORD_ASAR_NAMES = [
  "app.asar",
  "app.asar.unpacked",
];

export const DISCORD_ENTRY_POINTS: Record<string, string[]> = {
  win32: ["resources/app.asar"],
  linux: ["resources/app.asar"],
  darwin: ["Resources/app.asar"],
};

export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

export const DEFAULT_SETTINGS: import("./types").CadixSettings = {
  enabled: true,
  plugins: {},
  theme: "default",
  customCSS: "",
  developerMode: false,
  experimentalFeatures: false,
  notifications: true,
  autoUpdate: true,
  proxyEnabled: false,
  proxyUrl: "",
};
