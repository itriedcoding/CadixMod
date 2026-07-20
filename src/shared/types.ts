// CadixMod Shared Types

export interface CadixSettings {
  enabled: boolean;
  plugins: Record<string, PluginSettings>;
  theme: string;
  customCSS: string;
  developerMode: boolean;
  experimentalFeatures: boolean;
  notifications: boolean;
  autoUpdate: boolean;
  proxyEnabled: boolean;
  proxyUrl: string;
}

export interface PluginSettings {
  enabled: boolean;
  settings: Record<string, unknown>;
}

export interface PluginManifest {
  name: string;
  description: string;
  version: string;
  author: string;
  authors?: string[];
  dependencies?: string[];
  settings?: PluginSettingDef[];
  tags?: string[];
  color?: string;
  icon?: string;
}

export type PluginSettingDef =
  | { type: "text"; key: string; label: string; description?: string; default: string }
  | { type: "number"; key: string; label: string; description?: string; default: number; min?: number; max?: number }
  | { type: "boolean"; key: string; label: string; description?: string; default: boolean }
  | { type: "select"; key: string; label: string; description?: string; options: { label: string; value: string }[]; default: string }
  | { type: "slider"; key: string; label: string; description?: string; default: number; min: number; max: number; step?: number }
  | { type: "color"; key: string; label: string; description?: string; default: string };

export interface Plugin extends PluginManifest {
  start(): void;
  stop(): void;
  settings?: Record<string, unknown>;
}

export interface Patch {
  match: RegExp | string;
  replace: string | ((match: string, ...groups: string[]) => string);
  once?: boolean;
  priority?: number;
}

export interface ModulePatch {
  module: string | RegExp;
  patches: Patch[];
}

export interface IPCMessage {
  channel: string;
  data: unknown;
  id: string;
}

export interface IPCResponse {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

export type Platform = "win32" | "linux" | "darwin";

export interface DiscordWindow extends Window {
  DiscordNative: {
    app: {
      getVersion(): string;
      relaunch(): void;
      quit(): void;
    };
    clipboard: {
      copy(text: string): void;
      cut(): void;
      paste(): void;
    };
    powerSaveBlocker: {
      start(type: number): number;
      stop(id: number): void;
    };
    process: {
      arch: string;
      platform: string;
    };
  };
  webpackChunkdiscord_app: any[];
  Vencord: any;
  BdApi: any;
}
