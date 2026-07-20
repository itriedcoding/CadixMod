// CadixMod Discord API - Discord-specific utilities and module access

import { logger } from "../utils/logger";

class DiscordAPI {
  private static instance: DiscordAPI;
  private webpackModules: Map<string, any> = new Map();
  private webpackChunks: any[] = [];
  private modulesReady: boolean = false;

  private constructor() {}

  static getInstance(): DiscordAPI {
    if (!DiscordAPI.instance) {
      DiscordAPI.instance = new DiscordAPI();
    }
    return DiscordAPI.instance;
  }

  async initialize(): Promise<void> {
    logger.info("Initializing Discord API...");

    await this.waitForWebpack();
    this.modulesReady = true;

    logger.info("Discord API ready");
  }

  private async waitForWebpack(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (window.webpackChunkdiscord_app) {
          this.webpackChunks = window.webpackChunkdiscord_app;
          this.extractModules();
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  private extractModules(): void {
    const chunk = (id: number, entry: Function) => {
      const modules: Record<number, any> = {};
      const moduleStore = { exports: {} };

      entry(
        (id: number) => modules[id],
        moduleStore,
        (id: number) => {
          const mod = modules[id];
          if (mod) {
            const exported = mod.exports || mod;
            if (typeof exported === "function") {
              this.webpackModules.set(exported.name, exported);
              this.webpackModules.set(`__id_${id}`, exported);
            }
          }
        }
      );
    };

    for (const c of this.webpackChunks) {
      if (typeof c[1] === "object") {
        chunk(c[0], c[1]);
      }
    }
  }

  findModule(filter: (module: any) => boolean): any {
    for (const [, mod] of this.webpackModules) {
      if (filter(mod)) {
        return mod;
      }
    }
    return undefined;
  }

  findByProps(...props: string[]): any {
    return this.findModule(
      (mod) => typeof mod === "object" && props.every((p) => p in mod)
    );
  }

  findByDisplayName(name: string): any {
    return this.findModule(
      (mod) =>
        typeof mod === "function" &&
        (mod.displayName === name || mod.name === name)
    );
  }

  findByPrototypes(...props: string[]): any {
    return this.findModule(
      (mod) =>
        typeof mod === "function" &&
        mod.prototype &&
        props.every((p) => p in mod.prototype)
    );
  }

  findByStoreName(name: string): any {
    return this.findModule(
      (mod) =>
        typeof mod === "object" &&
        mod.default &&
        mod.default.displayName === name
    );
  }

  getWebpackModule(id: number): any {
    return this.webpackModules.get(`__id_${id}`);
  }

  getModuleCount(): number {
    return this.webpackModules.size;
  }

  isReady(): boolean {
    return this.modulesReady;
  }

  getCurrentUser(): any {
    const UserStore = this.findByStoreName("UserStore");
    return UserStore?.getCurrentUser?.();
  }

  getGuilds(): any[] {
    const GuildStore = this.findByStoreName("GuildStore");
    return GuildStore?.getGuilds?.() ? Object.values(GuildStore.getGuilds()) : [];
  }

  getChannels(guildId?: string): any[] {
    const ChannelStore = this.findByStoreName("ChannelStore");
    if (!ChannelStore) return [];

    if (guildId) {
      const guild = ChannelStore.getGuildChannelsForGuildId?.(guildId);
      return guild ? Object.values(guild) : [];
    }

    return ChannelStore.getAllChannels?.() ? Object.values(ChannelStore.getAllChannels()) : [];
  }

  sendMessage(channelId: string, content: string): void {
    const MessageActions = this.findByProps("sendMessage", "receiveMessage");
    const user = this.getCurrentUser();

    if (MessageActions && user) {
      MessageActions.sendMessage(channelId, {
        content,
        nonce: String(Date.now()),
        tts: false,
        invalidEmojis: [],
        validNonPremiumEmojis: [],
        attachments: [],
      });
    }
  }
}

export const discordAPI = DiscordAPI.getInstance();
export default discordAPI;
