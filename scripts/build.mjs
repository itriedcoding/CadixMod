import { build, context } from "esbuild";
import { readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WATCH = process.argv.includes("--watch");

const sharedDefines = {
  CADIXMOD_VERSION: JSON.stringify("1.0.0"),
  CADIXMOD_BUILDTIME: JSON.stringify(Date.now()),
};

/** @type {import('esbuild').BuildOptions} */
const commonOptions = {
  bundle: true,
  sourcemap: true,
  minify: !WATCH,
  define: sharedDefines,
  target: "node18",
  platform: "node",
  format: "esm",
  conditions: ["import", "module"],
  logLevel: "info",
};

function getPluginFiles() {
  const pluginsDir = join(ROOT, "src", "plugins");
  const files = [];

  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
        files.push(full);
      }
    }
  }

  walk(pluginsDir);
  return files;
}

const mainConfig = {
  ...commonOptions,
  entryPoints: [join(ROOT, "src", "main", "index.ts")],
  outfile: join(ROOT, "dist", "main", "index.js"),
  format: "cjs",
  platform: "node",
  target: "node18",
  banner: {
    js: `/* CadixMod v1.0.0 - Discord Client Mod */`,
  },
};

const preloadConfig = {
  ...commonOptions,
  entryPoints: [join(ROOT, "src", "preload", "index.ts")],
  outfile: join(ROOT, "dist", "preload", "index.js"),
  format: "cjs",
  platform: "node",
  target: "node18",
};

const rendererConfig = {
  ...commonOptions,
  entryPoints: [join(ROOT, "src", "renderer", "index.ts")],
  outfile: join(ROOT, "dist", "renderer", "index.js"),
  format: "iife",
  platform: "browser",
  target: "chrome120",
  globals: {
    react: "Vencord.Common.React",
  },
};

const pluginEntry = join(ROOT, "src", "plugins", "_index.ts");

async function main() {
  console.log("\x1b[36m[CadixMod]\x1b[0m Building...");

  if (WATCH) {
    const [mainCtx, preloadCtx, rendererCtx] = await Promise.all([
      context(mainConfig),
      context(preloadConfig),
      context(rendererConfig),
    ]);

    await Promise.all([
      mainCtx.watch(),
      preloadCtx.watch(),
      rendererCtx.watch(),
    ]);

    console.log("\x1b[32m[CadixMod]\x1b[0m Watching for changes...");
  } else {
    await Promise.all([
      build(mainConfig),
      build(preloadConfig),
      build(rendererConfig),
    ]);

    console.log("\x1b[32m[CadixMod]\x1b[0m Build complete!");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
