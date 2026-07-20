// CadixMod Plugin: Message Logger
// Logs all Discord messages to console and stores history in memory

import type { Plugin } from "../../shared/types";
import { logger } from "../../utils/logger";
import { Webpack } from "../../renderer/webpack";

interface LoggedMessage {
  id: string;
  channelId: string;
  guildId: string | null;
  author: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
  };
  content: string;
  timestamp: string;
  editedTimestamp: string | null;
  type: number;
  attachments: Array<{ id: string; filename: string; size: number; url: string }>;
  embeds: unknown[];
}

const messageHistory: LoggedMessage[] = [];
const MAX_HISTORY = 10000;

function getChannelStore(): { getChannel: (id: string) => { id: string; name: string; guild_id: string } | null } | null {
  const mod = Webpack.findByStoreName("ChannelStore");
  if (!mod?.default) return null;
  try {
    return new (mod.default as new () => { getChannel: (id: string) => { id: string; name: string; guild_id: string } | null })();
  } catch {
    return null;
  }
}

function getGuildStore(): { getGuild: (id: string) => { id: string; name: string } | null } | null {
  const mod = Webpack.findByStoreName("GuildStore");
  if (!mod?.default) return null;
  try {
    return new (mod.default as new () => { getGuild: (id: string) => { id: string; name: string } | null })();
  } catch {
    return null;
  }
}

function getUserStore(): { getCurrentUser: () => { id: string; username: string } | null } | null {
  const mod = Webpack.findByStoreName("UserStore");
  if (!mod?.default) return null;
  try {
    return new (mod.default as new () => { getCurrentUser: () => { id: string; username: string } | null })();
  } catch {
    return null;
  }
}

function handleMessageCreate(args: unknown[]): void {
  try {
    const message = args[0] as LoggedMessage;
    if (!message || !message.id) return;

    const logged: LoggedMessage = {
      id: message.id,
      channelId: message.channelId,
      guildId: message.guildId || null,
      author: {
        id: message.author?.id || "unknown",
        username: message.author?.username || "Unknown",
        discriminator: message.author?.discriminator || "0",
        avatar: message.author?.avatar || null,
      },
      content: message.content || "",
      timestamp: message.timestamp || new Date().toISOString(),
      editedTimestamp: message.editedTimestamp || null,
      type: message.type || 0,
      attachments: message.attachments || [],
      embeds: message.embeds || [],
    };

    messageHistory.push(logged);

    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.splice(0, messageHistory.length - MAX_HISTORY);
    }

    const channelStore = getChannelStore();
    const channel = channelStore?.getChannel(logged.channelId);
    const channelName = channel?.name || logged.channelId;

    logger.debug(`[MSG] ${logged.author.username} in #${channelName}: ${logged.content}`);
  } catch (err) {
    logger.error("Failed to log message:", err);
  }
}

function handleMessageUpdate(args: unknown[]): void {
  try {
    const message = args[0] as { id: string; channelId: string; content?: string };
    if (!message?.id) return;

    const existing = messageHistory.find((m) => m.id === message.id);
    if (existing && message.content) {
      existing.content = message.content;
      existing.editedTimestamp = new Date().toISOString();
      logger.debug(`[EDIT] ${existing.author.username}: ${message.content}`);
    }
  } catch (err) {
    logger.error("Failed to log message update:", err);
  }
}

function handleMessageDelete(args: unknown[]): void {
  try {
    const message = args[0] as { id: string; channelId: string };
    if (!message?.id) return;

    const index = messageHistory.findIndex((m) => m.id === message.id);
    if (index !== -1) {
      const removed = messageHistory.splice(index, 1)[0];
      logger.debug(`[DELETE] ${removed.author.username}: ${removed.content}`);
    }
  } catch (err) {
    logger.error("Failed to log message delete:", err);
  }
}

function handleMessageBulkDelete(args: unknown[]): void {
  try {
    const messages = args[0] as Array<{ id: string }>;
    if (!Array.isArray(messages)) return;

    for (const msg of messages) {
      const index = messageHistory.findIndex((m) => m.id === msg.id);
      if (index !== -1) {
        messageHistory.splice(index, 1);
      }
    }
    logger.debug(`[BULK DELETE] ${messages.length} messages removed from log`);
  } catch (err) {
    logger.error("Failed to log bulk delete:", err);
  }
}

function viewHistory(channelFilter?: string, limit = 50): LoggedMessage[] {
  let messages = [...messageHistory];
  if (channelFilter) {
    messages = messages.filter((m) => m.channelId === channelFilter);
  }
  return messages.slice(-limit);
}

function getHistoryStats(): { total: number; channels: Record<string, number> } {
  const channels: Record<string, number> = {};
  for (const msg of messageHistory) {
    channels[msg.channelId] = (channels[msg.channelId] || 0) + 1;
  }
  return { total: messageHistory.length, channels };
}

function printHistory(): void {
  const stats = getHistoryStats();
  console.group("%c[CadixMod] Message Logger History", "color: #5865f2; font-weight: bold");
  console.log(`Total logged messages: ${stats.total}`);
  console.log("Messages per channel:", stats.channels);
  console.log("Last 20 messages:");
  const recent = viewHistory(undefined, 20);
  console.table(
    recent.map((m) => ({
      author: m.author.username,
      channel: m.channelId,
      content: m.content.substring(0, 100),
      time: m.timestamp,
    }))
  );
  console.groupEnd();
}

let patches: Array<{ unpatch: () => void }> = [];

const plugin: Plugin = {
  id: "messagelogger",
  name: "MessageLogger",
  description: "Log all Discord messages",
  version: "1.0.0",
  author: "CadixMod",
  patches: [],

  start() {
    logger.debug("MessageLogger started");

    try {
      const messageModule = Webpack.findByProps("createMessage", "receiveMessage");
      if (messageModule) {
        const original = (messageModule as Record<string, Function>).receiveMessage;
        if (typeof original === "function") {
          (messageModule as Record<string, Function>).receiveMessage = function (...args: unknown[]) {
            handleMessageCreate(args);
            return original.apply(this, args);
          };
          patches.push({
            unpatch: () => {
              (messageModule as Record<string, Function>).receiveMessage = original;
            },
          });
        }
      }
    } catch (err) {
      logger.warn("Could not patch receiveMessage:", err);
    }

    try {
      const messageModule = Webpack.findByProps("deleteMessage", "editMessage");
      if (messageModule) {
        const origDelete = (messageModule as Record<string, Function>).deleteMessage;
        if (typeof origDelete === "function") {
          (messageModule as Record<string, Function>).deleteMessage = function (...args: unknown[]) {
            handleMessageDelete(args);
            return origDelete.apply(this, args);
          };
          patches.push({
            unpatch: () => {
              (messageModule as Record<string, Function>).deleteMessage = origDelete;
            },
          });
        }

        const origEdit = (messageModule as Record<string, Function>).editMessage;
        if (typeof origEdit === "function") {
          (messageModule as Record<string, Function>).editMessage = function (...args: unknown[]) {
            handleMessageUpdate(args);
            return origEdit.apply(this, args);
          };
          patches.push({
            unpatch: () => {
              (messageModule as Record<string, Function>).editMessage = origEdit;
            },
          });
        }
      }
    } catch (err) {
      logger.warn("Could not patch message actions:", err);
    }

    (window as Record<string, unknown>).cadixModMessageHistory = {
      view: viewHistory,
      stats: getHistoryStats,
      print: printHistory,
      clear: () => {
        messageHistory.length = 0;
        logger.info("Message history cleared");
      },
      messages: messageHistory,
    };
  },

  stop() {
    logger.debug("MessageLogger stopped");

    for (const p of patches) {
      try {
        p.unpatch();
      } catch (err) {
        logger.error("Failed to unpatch:", err);
      }
    }
    patches = [];

    delete (window as Record<string, unknown>).cadixModMessageHistory;
  },
};

export default plugin;
