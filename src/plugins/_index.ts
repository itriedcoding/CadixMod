// CadixMod Built-in Plugins Index
// Imports and exports all built-in plugins as a registered array

import type { Plugin } from "../shared/types";
import { pluginManager } from "../api/plugin";

import customcss from "./customcss/index";
import pluginloader from "./pluginloader/index";
import voicecontrols from "./voicecontrols/index";
import messageLogger from "./message_logger/index";
import betterfolders from "./betterfolders/index";
import notrack from "./notrack/index";

const builtInPlugins: Plugin[] = [
  customcss,
  pluginloader,
  voicecontrols,
  messageLogger,
  betterfolders,
  notrack,
];

export function registerAllPlugins(): void {
  for (const plugin of builtInPlugins) {
    pluginManager.register(plugin);
  }
}

export function getBuiltInPlugins(): Plugin[] {
  return [...builtInPlugins];
}

export { customcss, pluginloader, voicecontrols, messageLogger, betterfolders, notrack };

export default builtInPlugins;
