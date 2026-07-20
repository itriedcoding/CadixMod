import { build } from "esbuild";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync, readdirSync, cpSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const sharedDefines = {
  CADIXMOD_VERSION: JSON.stringify("1.0.0"),
  CADIXMOD_BUILDTIME: JSON.stringify(Date.now()),
};

/** @type {import('esbuild').BuildOptions} */
const commonOptions = {
  bundle: true,
  sourcemap: false,
  minify: true,
  define: sharedDefines,
  target: "node18",
  platform: "node",
  logLevel: "info",
  treeShaking: true,
};

function copyDirSync(src, dest) {
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      cpSync(srcPath, destPath);
    }
  }
}

async function main() {
  console.log("\x1b[36m[CadixMod]\x1b[0m Building mod...");

  const mainConfig = {
    ...commonOptions,
    entryPoints: [join(ROOT, "src", "main", "index.ts")],
    outfile: join(ROOT, "dist", "main", "index.js"),
    format: "cjs",
    external: ["electron"],
  };

  const preloadConfig = {
    ...commonOptions,
    entryPoints: [join(ROOT, "src", "preload", "index.ts")],
    outfile: join(ROOT, "dist", "preload", "index.js"),
    format: "cjs",
    external: ["electron"],
  };

  const rendererConfig = {
    ...commonOptions,
    entryPoints: [join(ROOT, "src", "renderer", "index.ts")],
    outfile: join(ROOT, "dist", "renderer", "index.js"),
    format: "iife",
    platform: "browser",
    target: "chrome120",
  };

  await Promise.all([
    build(mainConfig),
    build(preloadConfig),
    build(rendererConfig),
  ]);

  const appModDir = join(ROOT, "app", "dist", "mod");
  if (existsSync(join(ROOT, "dist"))) {
    copyDirSync(join(ROOT, "dist"), appModDir);
  }

  console.log("\x1b[32m[CadixMod]\x1b[0m Mod build complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
