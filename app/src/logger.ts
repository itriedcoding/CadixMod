const LOG_PREFIX = "[CadixMod]";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

let currentLevel: LogLevel = LogLevel.INFO;

function formatTime(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

export const logger = {
  setLevel(level: LogLevel) {
    currentLevel = level;
  },

  debug(...args: any[]) {
    if (currentLevel <= LogLevel.DEBUG) {
      console.debug(`\x1b[36m${LOG_PREFIX}\x1b[0m [${formatTime()}]`, ...args);
    }
  },

  info(...args: any[]) {
    if (currentLevel <= LogLevel.INFO) {
      console.log(`\x1b[32m${LOG_PREFIX}\x1b[0m [${formatTime()}]`, ...args);
    }
  },

  warn(...args: any[]) {
    if (currentLevel <= LogLevel.WARN) {
      console.warn(`\x1b[33m${LOG_PREFIX}\x1b[0m [${formatTime()}]`, ...args);
    }
  },

  error(...args: any[]) {
    if (currentLevel <= LogLevel.ERROR) {
      console.error(`\x1b[31m${LOG_PREFIX}\x1b[0m [${formatTime()}]`, ...args);
    }
  },
};
