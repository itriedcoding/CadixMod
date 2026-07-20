import { CADIXMOD_NAME } from "../shared/constants";
import { LogLevel } from "../shared/types";

type LogFunction = (...args: unknown[]) => void;

interface LoggerOptions {
  prefix?: string;
  color?: string;
  level?: LogLevel;
  timestamps?: boolean;
}

const LOG_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "#8B8B8B",
  [LogLevel.INFO]: "#00B0F4",
  [LogLevel.WARN]: "#FFD700",
  [LogLevel.ERROR]: "#FF4444",
  [LogLevel.SILENT]: "#000000",
};

let globalLogLevel: LogLevel = LogLevel.INFO;

function getTimestamp(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const ms = now.getMilliseconds().toString().padStart(3, "0");
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

function formatMessage(level: LogLevel, prefix: string, message: string): string {
  const timestamp = getTimestamp();
  const levelStr = LogLevel[level].padEnd(7);
  return `[${timestamp}] [${levelStr}] [${CADIXMOD_NAME}] [${prefix}] ${message}`;
}

function shouldLog(level: LogLevel): boolean {
  return level >= globalLogLevel;
}

function createLogMethod(
  level: LogLevel,
  prefix: string,
  color: string,
  timestamps: boolean
): LogFunction {
  return (...args: unknown[]) => {
    if (!shouldLog(level)) return;

    const style = `color: ${color}; font-weight: bold; font-size: 12px`;
    const timestampStyle = "color: #888; font-size: 11px";

    if (timestamps) {
      console.log(
        `%c[${getTimestamp()}]%c [${LogLevel[level].padEnd(7)}] %c[${CADIXMOD_NAME}]%c[${prefix}]`,
        timestampStyle,
        `color: ${color}; font-weight: bold`,
        `color: ${color}; font-weight: bold`,
        `color: ${color}`,
        ...args
      );
    } else {
      console.log(
        `%c[${LogLevel[level].padEnd(7)}] %c[${CADIXMOD_NAME}]%c[${prefix}]`,
        `color: ${color}; font-weight: bold`,
        style,
        `color: ${color}`,
        ...args
      );
    }
  };
}

export class Logger {
  private prefix: string;
  private color: string;
  private timestamps: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix ?? CADIXMOD_NAME;
    this.color = options.color ?? "#00B0F4";
    this.timestamps = options.timestamps ?? true;
  }

  debug: LogFunction = (...args: unknown[]) => {
    if (!shouldLog(LogLevel.DEBUG)) return;
    const method = createLogMethod(LogLevel.DEBUG, this.prefix, this.color, this.timestamps);
    method(...args);
  };

  info: LogFunction = (...args: unknown[]) => {
    if (!shouldLog(LogLevel.INFO)) return;
    const method = createLogMethod(LogLevel.INFO, this.prefix, this.color, this.timestamps);
    method(...args);
  };

  warn: LogFunction = (...args: unknown[]) => {
    if (!shouldLog(LogLevel.WARN)) return;
    const method = createLogMethod(LogLevel.WARN, this.prefix, "#FFD700", this.timestamps);
    method(...args);
  };

  error: LogFunction = (...args: unknown[]) => {
    if (!shouldLog(LogLevel.ERROR)) return;
    const method = createLogMethod(LogLevel.ERROR, this.prefix, "#FF4444", this.timestamps);
    method(...args);
  };

  log: LogFunction = (...args: unknown[]) => {
    this.info(...args);
  };

  child(name: string): Logger {
    return new Logger({
      prefix: `${this.prefix}:${name}`,
      color: this.color,
      timestamps: this.timestamps,
    });
  }

  setLevel(level: LogLevel): void {
    globalLogLevel = level;
  }

  getLevel(): LogLevel {
    return globalLogLevel;
  }

  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  setColor(color: string): void {
    this.color = color;
  }

  setTimestamps(enabled: boolean): void {
    this.timestamps = enabled;
  }

  group(label: string): void {
    console.group(`%c${label}`, `color: ${this.color}; font-weight: bold`);
  }

  groupEnd(): void {
    console.groupEnd();
  }

  table(data: unknown): void {
    console.table(data);
  }

  time(label: string): void {
    console.time(label);
  }

  timeEnd(label: string): void {
    console.timeEnd(label);
  }

  assert(condition: boolean, ...args: unknown[]): void {
    if (!condition) {
      this.error("Assertion failed:", ...args);
    }
  }

  trace(...args: unknown[]): void {
    console.trace(...args);
  }
}

export const logger = new Logger({ prefix: CADIXMOD_NAME, color: "#00B0F4" });

export function createLogger(name: string, color?: string): Logger {
  return new Logger({
    prefix: `${CADIXMOD_NAME}:${name}`,
    color: color ?? "#00B0F4",
  });
}

export function setGlobalLogLevel(level: LogLevel): void {
  globalLogLevel = level;
}

export function getGlobalLogLevel(): LogLevel {
  return globalLogLevel;
}
