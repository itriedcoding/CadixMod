// CadixMod Plugin: Message Logger
// Logs all messages to console and provides message history

import type { Plugin } from "../shared/types";
import { patcher } from "../api/patcher";
import { discordAPI } from "../api/discord";
import { logger } from "../utils/logger";

const log: string[] = [];

const plugin: Plugin = {
  name: "MessageLogger",
  description: "Logs all messages to console and stores message history",
  version: "1.0.0",
  author: "CadixMod",
  tags: ["utility", "logging"],

  start() {
    logger.debug("MessageLogger started");

    patcher.after("MessageActions", "sendMessage", (args, returnValue) => {
      const [channelId, message] = args;
      const user = discordAPI.getCurrentUser();

      log.push(
        JSON.stringify({
          timestamp: Date.now(),
          channel: channelId,
          author: user?.username || "Unknown",
          content: message.content,
          type: "sent",
        })
      );

      return returnValue;
    });
  },

  stop() {
    logger.debug("MessageLogger stopped");
  },

  settings: {
    maxLogSize: 1000,
    logToConsole: true,
  },
};

export default plugin;
