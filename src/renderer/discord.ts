import { createLogger } from "../utils/logger";
import { DiscordUser, DiscordGuild, DiscordChannel, DiscordRelationship } from "../shared/types";
import { Webpack } from "./webpack";

const log = createLogger("Discord", "#5865F2");

interface UserStore {
  getCurrentUser: () => DiscordUser | null;
  getUsers: () => Record<string, DiscordUser>;
}

interface GuildStore {
  getGuilds: () => Record<string, DiscordGuild>;
  getGuild: (id: string) => DiscordGuild | undefined;
}

interface ChannelStore {
  getChannels: (guildId: string) => DiscordChannel[];
  getChannel: (id: string) => DiscordChannel | undefined;
}

interface MessageStore {
  sendMessage: (channelId: string, content: string, embeds?: unknown[]) => Promise<unknown>;
  editMessage: (channelId: string, messageId: string, content: string) => Promise<unknown>;
  deleteMessage: (channelId: string, messageId: string) => Promise<unknown>;
}

interface RelationshipStore {
  getRelationships: () => DiscordRelationship[];
  getFriendCount: () => number;
}

interface PresenceStore {
  getState: () => Record<string, unknown>;
}

interface Dispatcher {
  dispatch: (event: string, data: Record<string, unknown>) => void;
  subscribe: (event: string, callback: (...args: unknown[]) => void) => () => void;
}

class DiscordAPI {
  private userStore: UserStore | null = null;
  private guildStore: GuildStore | null = null;
  private channelStore: ChannelStore | null = null;
  private messageStore: MessageStore | null = null;
  private relationshipStore: RelationshipStore | null = null;
  private dispatcher: Dispatcher | null = null;
  private initialized = false;

  init(): boolean {
    try {
      this.userStore = this.findStore<UserStore>("UserStore");
      this.guildStore = this.findStore<GuildStore>("GuildStore");
      this.channelStore = this.findStore<ChannelStore>("ChannelStore");
      this.messageStore = this.findStore<MessageStore>("MessageStore");
      this.relationshipStore = this.findStore<RelationshipStore>("RelationshipStore");
      this.dispatcher = this.findStore<Dispatcher>("Dispatcher");

      if (!this.userStore || !this.guildStore || !this.channelStore) {
        log.warn("Some Discord stores not found, API will be partially available");
      }

      this.initialized = true;
      log.info("Discord API initialized");
      return true;
    } catch (err) {
      log.error("Failed to initialize Discord API:", err);
      return false;
    }
  }

  private findStore<T>(name: string): T | null {
    const module = Webpack.findByStoreName(name);
    if (!module?.default) return null;
    try {
      const Store = module.default as new () => T;
      const instance = new Store();
      return instance;
    } catch (err) {
      return null;
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("Discord API not initialized");
    }
  }

  getCurrentUser(): DiscordUser | null {
    this.ensureInitialized();
    try {
      return this.userStore?.getCurrentUser() ?? null;
    } catch (err) {
      log.error("Failed to get current user:", err);
      return null;
    }
  }

  getUsers(): Record<string, DiscordUser> {
    this.ensureInitialized();
    try {
      return this.userStore?.getUsers() ?? {};
    } catch (err) {
      log.error("Failed to get users:", err);
      return {};
    }
  }

  getUser(userId: string): DiscordUser | null {
    this.ensureInitialized();
    try {
      const users = this.getUsers();
      return users[userId] ?? null;
    } catch (err) {
      log.error(`Failed to get user ${userId}:`, err);
      return null;
    }
  }

  getGuilds(): Record<string, DiscordGuild> {
    this.ensureInitialized();
    try {
      return this.guildStore?.getGuilds() ?? {};
    } catch (err) {
      log.error("Failed to get guilds:", err);
      return {};
    }
  }

  getGuild(guildId: string): DiscordGuild | null {
    this.ensureInitialized();
    try {
      return this.guildStore?.getGuild(guildId) ?? null;
    } catch (err) {
      log.error(`Failed to get guild ${guildId}:`, err);
      return null;
    }
  }

  getGuildList(): DiscordGuild[] {
    const guilds = this.getGuilds();
    return Object.values(guilds).sort((a, b) => a.name.localeCompare(b.name));
  }

  getChannels(guildId?: string): DiscordChannel[] {
    this.ensureInitialized();
    try {
      if (guildId) {
        return this.channelStore?.getChannels(guildId) ?? [];
      }
      const guilds = this.getGuilds();
      const allChannels: DiscordChannel[] = [];
      for (const guild of Object.values(guilds)) {
        const channels = this.channelStore?.getChannels(guild.id) ?? [];
        allChannels.push(...channels);
      }
      return allChannels;
    } catch (err) {
      log.error("Failed to get channels:", err);
      return [];
    }
  }

  getChannel(channelId: string): DiscordChannel | null {
    this.ensureInitialized();
    try {
      return this.channelStore?.getChannel(channelId) ?? null;
    } catch (err) {
      log.error(`Failed to get channel ${channelId}:`, err);
      return null;
    }
  }

  async sendMessage(channelId: string, content: string, embeds?: unknown[]): Promise<boolean> {
    this.ensureInitialized();
    try {
      await this.messageStore?.sendMessage(channelId, content, embeds);
      return true;
    } catch (err) {
      log.error(`Failed to send message to ${channelId}:`, err);
      return false;
    }
  }

  async editMessage(channelId: string, messageId: string, content: string): Promise<boolean> {
    this.ensureInitialized();
    try {
      await this.messageStore?.editMessage(channelId, messageId, content);
      return true;
    } catch (err) {
      log.error(`Failed to edit message ${messageId}:`, err);
      return false;
    }
  }

  async deleteMessage(channelId: string, messageId: string): Promise<boolean> {
    this.ensureInitialized();
    try {
      await this.messageStore?.deleteMessage(channelId, messageId);
      return true;
    } catch (err) {
      log.error(`Failed to delete message ${messageId}:`, err);
      return false;
    }
  }

  getRelationships(): DiscordRelationship[] {
    this.ensureInitialized();
    try {
      return this.relationshipStore?.getRelationships() ?? [];
    } catch (err) {
      log.error("Failed to get relationships:", err);
      return [];
    }
  }

  getFriends(): DiscordUser[] {
    return this.getRelationships()
      .filter((r) => r.type === 1)
      .map((r) => r.user);
  }

  getStates(): Record<string, unknown> {
    this.ensureInitialized();
    try {
      const store = Webpack.findByStoreName("PresenceStore");
      if (store?.default) {
        const instance = new (store.default as new () => PresenceStore)();
        return instance.getState() as Record<string, unknown>;
      }
      return {};
    } catch (err) {
      log.error("Failed to get states:", err);
      return {};
    }
  }

  dispatch(event: string, data: Record<string, unknown>): void {
    this.ensureInitialized();
    try {
      this.dispatcher?.dispatch(event, data);
    } catch (err) {
      log.error(`Failed to dispatch event ${event}:`, err);
    }
  }

  subscribe(event: string, callback: (...args: unknown[]) => void): () => void {
    this.ensureInitialized();
    try {
      return this.dispatcher?.subscribe(event, callback) ?? (() => {});
    } catch (err) {
      log.error(`Failed to subscribe to event ${event}:`, err);
      return () => {};
    }
  }

  getSelectedGuildId(): string | null {
    try {
      const module = Webpack.findByProps("getGuildId", "getChannelId");
      if (module && typeof (module as Record<string, unknown>).getGuildId === "function") {
        return ((module as Record<string, Function>).getGuildId() as string) ?? null;
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  getSelectedChannelId(): string | null {
    try {
      const module = Webpack.findByProps("getChannelId");
      if (module && typeof (module as Record<string, unknown>).getChannelId === "function") {
        return ((module as Record<string, Function>).getChannelId() as string) ?? null;
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  isInGuild(guildId: string): boolean {
    const guild = this.getGuild(guildId);
    return guild !== null;
  }

  hasPermission(channelId: string, permission: string): boolean {
    try {
      const permModule = Webpack.findByProps("Permissions", "computePermissions");
      if (!permModule) return false;
      const perms = (permModule as Record<string, Function>).computePermissions?.(channelId);
      if (typeof perms !== "number") return false;
      const permValue = (permModule as Record<string, Record<string, number>>).Permissions?.[permission];
      if (typeof permValue !== "number") return false;
      return (perms & permValue) === permValue;
    } catch (err) {
      return false;
    }
  }
}

export const Discord = new DiscordAPI();

export default Discord;
