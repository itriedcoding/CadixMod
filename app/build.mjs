import { build } from "esbuild";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const sharedOptions = {
  bundle: true,
  sourcemap: true,
  minify: false,
  target: "node18",
  platform: "node",
  format: "cjs",
  logLevel: "info",
};

async function main() {
  console.log("\x1b[36m[CadixMod Desktop]\x1b[0m Building...");

  await build({
    ...sharedOptions,
    entryPoints: [join(__dirname, "src", "main.ts")],
    outfile: join(__dirname, "dist", "main.js"),
    external: ["electron"],
  });

  await build({
    ...sharedOptions,
    entryPoints: [join(__dirname, "src", "preload.ts")],
    outfile: join(__dirname, "dist", "preload.js"),
    external: ["electron"],
  });

  await build({
    ...sharedOptions,
    entryPoints: [join(__dirname, "src", "renderer.ts")],
    outfile: join(__dirname, "dist", "renderer.js"),
    format: "iife",
    platform: "browser",
    target: "chrome120",
  });

  console.log("\x1b[32m[CadixMod Desktop]\x1b[0m Build complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
