export interface CadixSettings {
  general: {
    enablePlugins: boolean;
    enableThemes: boolean;
    enableDevTools: boolean;
    debugMode: boolean;
    logLevel: LogLevel;
  };
  plugins: Record<string, PluginSettings>;
  themes: Record<string, ThemeSettings>;
  ui: {
    showBadges: boolean;
    showToasts: boolean;
    compactMode: boolean;
    sidebarPosition: "left" | "right";
  };
  developer: {
    reactDevTools: boolean;
    inspectElement: boolean;
    verboseLogging: boolean;
  };
}

export interface PluginSettings {
  enabled: boolean;
  order: number;
  config: Record<string, unknown>;
}

export interface ThemeSettings {
  enabled: boolean;
  order: number;
  overrides: Record<string, string>;
}

export interface Patch {
  id: string;
  pluginId: string;
  module: string;
  methodName: string;
  type: "before" | "after" | "instead";
  priority: number;
  callback: PatchCallback;
  original?: Function;
  unpatched: boolean;
}

export type PatchCallback = {
  before?: (thisObj: unknown, args: unknown[], context: PatchContext) => unknown[] | void;
  after?: (thisObj: unknown, args: unknown[], result: unknown, context: PatchContext) => unknown;
  instead?: (thisObj: unknown, args: unknown[], original: Function, context: PatchContext) => unknown;
};

export interface PatchContext {
  patch: Patch;
  module: DiscordModule;
  methodName: string;
}

export interface ModulePatch {
  moduleName: string;
  patches: Patch[];
  originals: Map<string, Function>;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  patches: PluginPatch[];
  settings?: Record<string, unknown>;
  start(): void;
  stop(): void;
  load?(): void;
  unload?(): void;
  onSettingsUpdate?(settings: Record<string, unknown>): void;
}

export interface PluginPatch {
  module: string;
  methodName: string;
  type: "before" | "after" | "instead";
  priority?: number;
  callback: PatchCallback;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  css: string;
  variables: Record<string, string>;
  enabled: boolean;
}

export interface DiscordModule {
  default?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface WebpackChunk {
  [key: number]: {
    i: number[];
    m: Record<number, (module: DiscordModule, exports: unknown, require: WebpackRequire) => void>;
    l: boolean;
  };
}

export interface WebpackRequire {
  (id: number): DiscordModule;
  m: Record<number, (module: DiscordModule, exports: unknown, require: WebpackRequire) => void>;
  c: Record<number, { exports: unknown }>;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  bot?: boolean;
  system?: boolean;
  banner?: string | null;
  accent_color?: number | null;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: number;
  member_count: number;
  approximate_member_count?: number;
  approximate_presence_count?: number;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  guild_id: string;
  position: number;
  topic?: string;
  nsfw?: boolean;
  last_message_id?: string;
}

export interface DiscordRelationship {
  type: number;
  id: string;
  user: DiscordUser;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export interface ToastOptions {
  title: string;
  content?: string;
  type?: "info" | "success" | "warning" | "error";
  duration?: number;
  onClick?: () => void;
}

export interface ModalOptions {
  title: string;
  content: string;
  buttons?: ModalButton[];
  onClose?: () => void;
}

export interface ModalButton {
  label: string;
  style?: "primary" | "secondary" | "danger";
  onClick: () => void;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  badge?: number;
  active?: boolean;
}
