// CadixMod Patcher - Runtime module patching system
// Intercepts and modifies Discord's webpack modules

import { logger } from "../utils/logger";

interface PatchEntry {
  id: string;
  module: any;
  original: Function;
  replacement: Function;
  once: boolean;
  priority: number;
}

class Patcher {
  private static instance: Patcher;
  private patches: Map<string, PatchEntry[]> = new Map();
  private originalMethods: Map<string, Function> = new Map();
  private beforeCallbacks: Map<string, Function[]> = new Map();
  private afterCallbacks: Map<string, Function[]> = new Map();

  private constructor() {}

  static getInstance(): Patcher {
    if (!Patcher.instance) {
      Patcher.instance = new Patcher();
    }
    return Patcher.instance;
  }

  before(
    module: string,
    method: string,
    callback: (args: any[], id: string) => any[] | void,
    options?: { priority?: number; once?: boolean }
  ): string {
    const id = `${module}.${method}:${Date.now()}`;
    const key = `${module}:${method}`;

    if (!this.beforeCallbacks.has(key)) {
      this.beforeCallbacks.set(key, []);
    }

    this.beforeCallbacks.get(key)!.push(callback as Function);
    logger.debug(`Registered before-patch: ${key}`);

    return id;
  }

  after(
    module: string,
    method: string,
    callback: (args: any[], returnValue: any, id: string) => any,
    options?: { priority?: number; once?: boolean }
  ): string {
    const id = `${module}.${method}:${Date.now()}`;
    const key = `${module}:${method}`;

    if (!this.afterCallbacks.has(key)) {
      this.afterCallbacks.set(key, []);
    }

    this.afterCallbacks.get(key)!.push(callback as Function);
    logger.debug(`Registered after-patch: ${key}`);

    return id;
  }

  instead(
    module: string,
    method: string,
    callback: (args: any[], original: Function, id: string) => any,
    options?: { priority?: number; once?: boolean }
  ): string {
    const id = `${module}.${method}:${Date.now()}`;
    const key = `${module}:${method}`;

    const patch: PatchEntry = {
      id,
      module: null,
      original: Function.prototype,
      replacement: callback as Function,
      once: options?.once ?? false,
      priority: options?.priority ?? 0,
    };

    if (!this.patches.has(key)) {
      this.patches.set(key, []);
    }

    this.patches.get(key)!.push(patch);
    this.patches.get(key)!.sort((a, b) => b.priority - a.priority);

    logger.debug(`Registered instead-patch: ${key}`);
    return id;
  }

  unpatch(id: string): void {
    for (const [key, patches] of this.patches) {
      const index = patches.findIndex((p) => p.id === id);
      if (index !== -1) {
        patches.splice(index, 1);
        logger.debug(`Removed patch: ${id}`);
        return;
      }
    }
  }

  unpatchAll(): void {
    this.patches.clear();
    this.beforeCallbacks.clear();
    this.afterCallbacks.clear();
    this.originalMethods.clear();
    logger.debug("All patches removed");
  }

  getOriginalMethod(module: string, method: string): Function | undefined {
    return this.originalMethods.get(`${module}:${method}`);
  }

  isPatched(module: string, method: string): boolean {
    const key = `${module}:${method}`;
    return (
      this.patches.has(key) &&
      (this.patches.get(key)!.length > 0 ||
        this.beforeCallbacks.has(key) ||
        this.afterCallbacks.has(key))
    );
  }

  getPatches(): Map<string, PatchEntry[]> {
    return new Map(this.patches);
  }

  getPatchCount(): number {
    let count = 0;
    for (const patches of this.patches.values()) {
      count += patches.length;
    }
    for (const callbacks of this.beforeCallbacks.values()) {
      count += callbacks.length;
    }
    for (const callbacks of this.afterCallbacks.values()) {
      count += callbacks.length;
    }
    return count;
  }
}

export const patcher = Patcher.getInstance();
export default patcher;
