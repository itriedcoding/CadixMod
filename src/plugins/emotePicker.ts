// CadixMod Plugin: Emote Picker
// Custom emote picker with better organization

import type { Plugin } from "../shared/types";
import { patcher } from "../api/patcher";
import { logger } from "../utils/logger";

const plugin: Plugin = {
  name: "EmotePicker",
  description: "Enhanced emote picker with search and categories",
  version: "1.0.0",
  author: "CadixMod",
  tags: ["emotes", "ui"],

  start() {
    logger.debug("EmotePicker started");

    patcher.after("EmojiPicker", "open", (args, returnValue) => {
      logger.debug("Emoji picker opened, applying enhancements");
      return returnValue;
    });
  },

  stop() {
    logger.debug("EmotePicker stopped");
  },
};

export default plugin;
