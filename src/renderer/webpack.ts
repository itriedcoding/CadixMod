import { createLogger } from "../utils/logger";
import { DiscordModule } from "../shared/types";

const log = createLogger("Webpack", "#5865F2");

type ModuleFilter = (module: DiscordModule) => boolean;
type ModulePredicate = (module: DiscordModule, index: number) => boolean;

interface WebpackChunk {
  [key: number]: {
    i: number[];
    m: Record<number, (module: DiscordModule, exports: unknown, require: WebpackRequire) => void>;
    l: boolean;
  };
}

interface WebpackRequire {
  (id: number): DiscordModule;
  m: Record<number, (module: DiscordModule, exports: unknown, require: WebpackRequire) => void>;
  c: Record<number, { exports: unknown }>;
  d: (exports: unknown, getters: Record<string, () => unknown>) => void;
  r: (exports: unknown) => void;
  e: (chunkId: number) => Promise<void>;
  installedChunks?: Record<number, number>;
}

declare global {
  interface Window {
    webpackChunkdiscord_app?: WebpackChunk[];
  }
}

class WebpackManager {
  private modules: DiscordModule[] = [];
  private moduleCache: Map<number, DiscordModule> = new Map();
  private propsCache: Map<string, DiscordModule> = new Map();
  private displayNameCache: Map<string, DiscordModule> = new Map();
  private storeCache: Map<string, DiscordModule> = new Map();
  private loaded = false;
  private require: WebpackRequire | null = null;
  private listeners: Array<() => void> = [];

  init(): Promise<void> {
    return new Promise((resolve) => {
      if (this.loaded) {
        resolve();
        return;
      }

      const chunks = window.webpackChunkdiscord_app;
      if (!chunks) {
        log.error("webpackChunkdiscord_app not found, Discord may not have loaded yet");
        setTimeout(() => this.init().then(resolve), 100);
        return;
      }

      this.interceptChunks(chunks);
      this.extractModules();
      this.loaded = true;
      log.info(`Loaded ${this.modules.length} webpack modules`);
      resolve();
    });
  }

  private interceptChunks(chunks: WebpackChunk[]): void {
    const push = chunks.push.bind(chunks);

    chunks.push = (...args: unknown[]) => {
      const chunk = args as unknown as WebpackChunk[number];
      if (chunk && typeof chunk === "object") {
        for (const moduleId of Object.keys(chunk.i || {})) {
          const id = Number(moduleId);
          if (!this.moduleCache.has(id)) {
            const moduleObj: DiscordModule = {};
            try {
              const factory = chunk.m?.[id];
              if (factory) {
                const fakeRequire = this.createFakeRequire();
                factory(moduleObj, moduleObj, fakeRequire);
                this.moduleCache.set(id, moduleObj);
              }
            } catch (err) {
              // Module failed to load, skip it
            }
          }
        }
      }
      return push(...args);
    };

    for (const chunk of chunks) {
      if (chunk && typeof chunk === "object") {
        for (const moduleId of Object.keys(chunk.i || {})) {
          const id = Number(moduleId);
          if (!this.moduleCache.has(id)) {
            const moduleObj: DiscordModule = {};
            try {
              const factory = chunk.m?.[id];
              if (factory) {
                const fakeRequire = this.createFakeRequire();
                factory(moduleObj, moduleObj, fakeRequire);
                this.moduleCache.set(id, moduleObj);
              }
            } catch (err) {
              // Module failed to load, skip it
            }
          }
        }
      }
    }
  }

  private createFakeRequire(): WebpackRequire {
    const self = this;
    const fakeRequire = function (id: number): DiscordModule {
      return self.moduleCache.get(id) || {};
    } as WebpackRequire;
    fakeRequire.m = {};
    fakeRequire.c = {};
    fakeRequire.d = (_exports: unknown, getters: Record<string, () => unknown>) => {
      for (const key of Object.keys(getters)) {
        try {
          Object.defineProperty(_exports, key, {
            get: getters[key],
            enumerable: true,
          });
        } catch (err) {
          // Define property failed
        }
      }
    };
    fakeRequire.r = (exports: unknown) => {
      Object.defineProperty(exports, "__esModule", { value: true });
    };
    fakeRequire.e = () => Promise.resolve();
    return fakeRequire;
  }

  private extractModules(): void {
    this.modules = Array.from(this.moduleCache.values());
    this.buildCaches();
  }

  private buildCaches(): void {
    for (const module of this.modules) {
      if (module.default && typeof module.default === "object") {
        const def = module.default as Record<string, unknown>;
        if (def.displayName) {
          this.displayNameCache.set(def.displayName as string, module);
        }
        for (const key of Object.keys(def)) {
          this.propsCache.set(key, module);
        }
      }
      for (const key of Object.keys(module)) {
        if (key === "default") continue;
        this.propsCache.set(key, module);
      }
    }
  }

  onLoaded(callback: () => void): void {
    if (this.loaded) {
      callback();
    } else {
      this.listeners.push(callback);
    }
  }

  getAllModules(): DiscordModule[] {
    return [...this.modules];
  }

  getModuleById(id: number): DiscordModule | undefined {
    return this.moduleCache.get(id);
  }

  find(predicate: ModulePredicate): DiscordModule | undefined {
    return this.modules.find(predicate);
  }

  findAll(predicate: ModulePredicate): DiscordModule[] {
    return this.modules.filter(predicate);
  }

  findByProps(...props: string[]): DiscordModule | undefined {
    for (const module of this.modules) {
      if (module.default && typeof module.default === "object") {
        const def = module.default as Record<string, unknown>;
        if (props.every((prop) => prop in def)) {
          return module;
        }
      }
      if (props.every((prop) => prop in module)) {
        return module;
      }
    }
    return undefined;
  }

  findAllByProps(...props: string[]): DiscordModule[] {
    return this.modules.filter((module) => {
      if (module.default && typeof module.default === "object") {
        const def = module.default as Record<string, unknown>;
        if (props.every((prop) => prop in def)) {
          return true;
        }
      }
      return props.every((prop) => prop in module);
    });
  }

  findByDisplayName(name: string): DiscordModule | undefined {
    return this.displayNameCache.get(name);
  }

  findByPrototypes(...prototypes: string[]): DiscordModule | undefined {
    return this.modules.find((module) => {
      for (const proto of prototypes) {
        if (module.default && typeof module.default === "function") {
          const protoObj = (module.default as Function).prototype;
          if (protoObj && proto in protoObj) {
            continue;
          }
          return false;
        }
        return false;
      }
      return true;
    });
  }

  findByStoreName(name: string): DiscordModule | undefined {
    if (this.storeCache.has(name)) {
      return this.storeCache.get(name);
    }
    for (const module of this.modules) {
      if (module.default && typeof module.default === "function") {
        const def = module.default as Function;
        const storeName = (def as unknown as { displayName?: string }).displayName;
        if (storeName === name) {
          this.storeCache.set(name, module);
          return module;
        }
      }
    }
    return undefined;
  }

  getStore<T>(name: string): T | undefined {
    const module = this.findByStoreName(name);
    if (!module) return undefined;
    try {
      const Store = module.default as new () => T;
      return Store.prototype?.getState ? new Store() : undefined;
    } catch (err) {
      return undefined;
    }
  }

  getWebpackRequire(): WebpackRequire | null {
    return this.require;
  }

  getModuleByExport(exportName: string): DiscordModule | undefined {
    return this.modules.find((module) => {
      if (module.default && typeof module.default === "object") {
        return exportName in (module.default as Record<string, unknown>);
      }
      return exportName in module;
    });
  }

  search(query: string): DiscordModule[] {
    const lower = query.toLowerCase();
    return this.modules.filter((module) => {
      const keys = Object.keys(module);
      return keys.some((key) => key.toLowerCase().includes(lower));
    });
  }

  invalidate(): void {
    this.modules = [];
    this.moduleCache.clear();
    this.propsCache.clear();
    this.displayNameCache.clear();
    this.storeCache.clear();
    this.loaded = false;
    this.require = null;
    log.info("Webpack cache invalidated");
  }
}

export const Webpack = new WebpackManager();

export default Webpack;
