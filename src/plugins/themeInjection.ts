// CadixMod Plugin: Theme Injection
// Allows loading custom themes from the themes directory

import type { Plugin } from "../shared/types";
import { logger } from "../utils/logger";
import { injectCSS, updateCSS } from "../renderer/css";

const plugin: Plugin = {
  name: "ThemeInjection",
  description: "Load and apply custom CSS themes",
  version: "1.0.0",
  author: "CadixMod",
  tags: ["themes", "customization"],

  start() {
    logger.debug("ThemeInjection started");
    injectCSS();
  },

  stop() {
    logger.debug("ThemeInjection stopped");
    updateCSS("");
  },
};

export default plugin;
