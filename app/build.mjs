import { build } from "esbuild";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { rmSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("\x1b[36m[CadixMod Desktop]\x1b[0m Building...");

  if (existsSync(join(__dirname, "dist"))) {
    rmSync(join(__dirname, "dist"), { recursive: true, force: true });
  }

  await build({
    bundle: true,
    sourcemap: true,
    minify: false,
    target: "node18",
    platform: "node",
    format: "cjs",
    logLevel: "info",
    entryPoints: [join(__dirname, "src", "main.ts")],
    outfile: join(__dirname, "dist", "main.js"),
    external: ["electron", "path", "fs", "os", "child_process"],
  });

  await build({
    bundle: true,
    sourcemap: true,
    minify: false,
    target: "node18",
    platform: "node",
    format: "cjs",
    logLevel: "info",
    entryPoints: [join(__dirname, "src", "preload.ts")],
    outfile: join(__dirname, "dist", "preload.js"),
    external: ["electron"],
  });

  await build({
    bundle: true,
    sourcemap: false,
    minify: true,
    target: "chrome120",
    platform: "browser",
    format: "iife",
    logLevel: "info",
    entryPoints: [join(__dirname, "src", "renderer.ts")],
    outfile: join(__dirname, "dist", "renderer.js"),
  });

  console.log("\x1b[32m[CadixMod Desktop]\x1b[0m Build complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
