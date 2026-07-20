import { createLogger } from "../utils/logger";
import { Patch, PatchCallback, PatchContext } from "../shared/types";
import { Webpack } from "./webpack";

const log = createLogger("Patcher", "#5865F2");

let patchIdCounter = 0;

function generatePatchId(): string {
  return `cadix_patch_${++patchIdCounter}`;
}

class PatcherManager {
  private patches: Map<string, Patch> = new Map();
  private patchedMethods: Map<string, { original: Function; replacement: Function }> = new Map();
  private enabled = true;

  init(): void {
    log.info("Patcher initialized");
  }

  createPatch(
    pluginId: string,
    module: string,
    methodName: string,
    type: Patch["type"],
    callback: PatchCallback,
    priority: number = 50
  ): Patch {
    const patch: Patch = {
      id: generatePatchId(),
      pluginId,
      module,
      methodName,
      type,
      priority,
      callback,
      unpatched: false,
    };
    this.patches.set(patch.id, patch);
    return patch;
  }

  before(
    pluginId: string,
    module: string,
    methodName: string,
    callback: PatchCallback["before"],
    priority: number = 50
  ): Patch {
    return this.createPatch(pluginId, module, methodName, "before", { before: callback }, priority);
  }

  after(
    pluginId: string,
    module: string,
    methodName: string,
    callback: PatchCallback["after"],
    priority: number = 50
  ): Patch {
    return this.createPatch(pluginId, module, methodName, "after", { after: callback }, priority);
  }

  instead(
    pluginId: string,
    module: string,
    methodName: string,
    callback: PatchCallback["instead"],
    priority: number = 50
  ): Patch {
    return this.createPatch(pluginId, module, methodName, "instead", { instead: callback }, priority);
  }

  applyPatch(target: Record<string, unknown>, methodName: string, patch: Patch): boolean {
    if (!this.enabled) return false;

    const original = target[methodName];
    if (typeof original !== "function") {
      log.warn(`Cannot patch ${methodName}: not a function`);
      return false;
    }

    patch.original = original;

    const methodPatches = this.getSortedPatches(methodName);
    const replacement = this.createReplacementFunction(original, methodPatches);

    target[methodName] = replacement;
    this.patchedMethods.set(`${methodName}_${patch.id}`, { original, replacement });

    log.debug(`Applied ${patch.type} patch to ${methodName}`);
    return true;
  }

  private createReplacementFunction(
    original: Function,
    patches: Patch[]
  ): Function {
    const self = this;
    return function (this: unknown, ...args: unknown[]) {
      if (!self.enabled) {
        return original.apply(this, args);
      }

      let currentArgs = [...args];
      let cancelled = false;

      for (const patch of patches) {
        if (patch.unpatched || patch.type !== "before") continue;
        try {
          const beforeCallback = patch.callback.before;
          if (beforeCallback) {
            const result = beforeCallback(this, currentArgs, {
              patch,
              module: {},
              methodName: "",
            });
            if (Array.isArray(result)) {
              currentArgs = result;
            }
          }
        } catch (err) {
          log.error(`Error in before patch for ${methodName}:`, err);
        }
      }

      let result: unknown;
      let usedInstead = false;

      for (const patch of patches) {
        if (patch.unpatched || patch.type !== "instead") continue;
        try {
          const insteadCallback = patch.callback.instead;
          if (insteadCallback) {
            result = insteadCallback(this, currentArgs, original, {
              patch,
              module: {},
              methodName: "",
            });
            usedInstead = true;
            break;
          }
        } catch (err) {
          log.error(`Error in instead patch for ${methodName}:`, err);
        }
      }

      if (!usedInstead) {
        result = original.apply(this, currentArgs);
      }

      for (const patch of patches) {
        if (patch.unpatched || patch.type !== "after") continue;
        try {
          const afterCallback = patch.callback.after;
          if (afterCallback) {
            const afterResult = afterCallback(this, currentArgs, result, {
              patch,
              module: {},
              methodName: "",
            });
            if (afterResult !== undefined) {
              result = afterResult;
            }
          }
        } catch (err) {
          log.error(`Error in after patch for ${methodName}:`, err);
        }
      }

      return result;
    };
  }

  private getSortedPatches(methodName: string): Patch[] {
    const patches = Array.from(this.patches.values())
      .filter((p) => p.methodName === methodName && !p.unpatched)
      .sort((a, b) => a.priority - b.priority);
    return patches;
  }

  unpatch(patchId: string): boolean {
    const patch = this.patches.get(patchId);
    if (!patch) {
      log.warn(`Patch ${patchId} not found`);
      return false;
    }

    patch.unpatched = true;
    this.patches.delete(patchId);

    const remaining = Array.from(this.patches.values()).filter(
      (p) => p.methodName === patch.methodName && !p.unpatched
    );

    if (remaining.length === 0) {
      this.restoreMethod(patch.methodName);
    }

    log.debug(`Unpatched ${patch.methodName} (${patchId})`);
    return true;
  }

  unpatchAll(pluginId?: string): number {
    let count = 0;
    const patchesToRemove: string[] = [];

    for (const [id, patch] of this.patches) {
      if (pluginId && patch.pluginId !== pluginId) continue;
      patchesToRemove.push(id);
      patch.unpatched = true;
      count++;
    }

    for (const id of patchesToRemove) {
      this.patches.delete(id);
    }

    const affectedMethods = new Set<string>();
    for (const id of patchesToRemove) {
      const patch = this.patches.get(id);
      if (patch) {
        affectedMethods.add(patch.methodName);
      }
    }

    for (const method of affectedMethods) {
      const remaining = Array.from(this.patches.values()).filter(
        (p) => p.methodName === method && !p.unpatched
      );
      if (remaining.length === 0) {
        this.restoreMethod(method);
      }
    }

    if (patchesToRemove.length > 0) {
      log.info(`Unpatched ${count} patches${pluginId ? ` for plugin ${pluginId}` : ""}`);
    }
    return count;
  }

  private restoreMethod(methodName: string): void {
    for (const [key, data] of this.patchedMethods) {
      if (key.startsWith(methodName)) {
        this.patchedMethods.delete(key);
        break;
      }
    }
  }

  enable(): void {
    this.enabled = true;
    log.info("Patcher enabled");
  }

  disable(): void {
    this.enabled = false;
    log.info("Patcher disabled");
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getPatchCount(): number {
    return this.patches.size;
  }

  getPatchesForPlugin(pluginId: string): Patch[] {
    return Array.from(this.patches.values()).filter((p) => p.pluginId === pluginId);
  }

  getAllPatches(): Patch[] {
    return Array.from(this.patches.values());
  }

  hasPatch(patchId: string): boolean {
    return this.patches.has(patchId);
  }

  updatePatchPriority(patchId: string, priority: number): boolean {
    const patch = this.patches.get(patchId);
    if (!patch) return false;
    patch.priority = priority;
    return true;
  }

  cleanup(): void {
    this.unpatchAll();
    this.patchedMethods.clear();
    log.info("Patcher cleaned up");
  }
}

export const Patcher = new PatcherManager();

export default Patcher;
