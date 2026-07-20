// CadixMod Logger - Cross-platform logging utility

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const COLORS = {
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  reset: "\x1b[0m",
} as const;

const ICONS = {
  debug: "[?]",
  info: "[*]",
  warn: "[!]",
  error: "[X]",
} as const;

class Logger {
  private static instance: Logger;
  private level: LogLevel = LogLevel.INFO;
  private prefix: string;

  constructor(prefix: string = "CadixMod") {
    this.prefix = prefix;
  }

  static getInstance(prefix?: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(prefix);
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(
        `${COLORS.debug}${ICONS.debug} [${this.prefix}]${COLORS.reset}`,
        ...args
      );
    }
  }

  info(...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(
        `${COLORS.info}${ICONS.info} [${this.prefix}]${COLORS.reset}`,
        ...args
      );
    }
  }

  warn(...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(
        `${COLORS.warn}${ICONS.warn} [${this.prefix}]${COLORS.reset}`,
        ...args
      );
    }
  }

  error(...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(
        `${COLORS.error}${ICONS.error} [${this.prefix}]${COLORS.reset}`,
        ...args
      );
    }
  }

  child(prefix: string): Logger {
    return new Logger(`${this.prefix}:${prefix}`);
  }
}

export const logger = Logger.getInstance();
export default logger;
