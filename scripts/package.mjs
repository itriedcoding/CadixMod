// CadixMod Package Script
// Creates distributable packages for each platform

import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { platform, arch } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST_PATH = join(ROOT, "dist");
const BUILD_PATH = join(ROOT, "build");

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function copyDirSync(src, dest) {
  ensureDir(dest);
  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function packageApp() {
  console.log("\x1b[36m[CadixMod]\x1b[0m Packaging...");

  if (!existsSync(DIST_PATH)) {
    console.error("\x1b[31m[X]\x1b[0m dist/ not found. Run 'npm run build' first.");
    process.exit(1);
  }

  const platform_ = platform();
  const arch_ = arch();
  const version = "1.0.0";

  const platformNames = {
    win32: "windows",
    linux: "linux",
    darwin: "macos",
  };

  const platformName = platformNames[platform_] || platform_;
  const packageName = `cadixmod-${platformName}-${arch_}-v${version}`;

  const packagePath = join(BUILD_PATH, packageName);
  ensureDir(packagePath);

  console.log(`\x1b[36m[CadixMod]\x1b[0m Creating package: ${packageName}`);

  copyDirSync(DIST_PATH, join(packagePath, "dist"));

  copyFileSync(
    join(ROOT, "scripts", platform_ === "win32" ? "install.ps1" : "install.sh"),
    join(packagePath, "install" + (platform_ === "win32" ? ".ps1" : ".sh"))
  );

  copyFileSync(
    join(ROOT, "scripts", "uninject.mjs"),
    join(packagePath, "uninject.mjs")
  );

  const readme = `# CadixMod v${version}

A high-performance, cross-platform Discord client mod.

## Installation

${platform_ === "win32" ? `
### Windows
\`\`\`powershell
.\\install.ps1
\`\`\`
` : `
### ${platformName === "macos" ? "macOS" : "Linux"}
\`\`\`bash
chmod +x install.sh
./install.sh
\`\`\`
`}

## Uninstallation

${platform_ === "win32" ? `
\`\`\`powershell
.\\install.ps1 uninstall
\`\`\`
` : `
\`\`\`bash
./install.sh uninstall
\`\`\`
`}

## Features

- Cross-platform support (Windows, Linux, macOS)
- Plugin system with hot-reloading
- Custom CSS themes
- Runtime module patching
- Settings panel with GUI
- Auto-update support

## For Developers

### Building from Source

\`\`\`bash
npm install
npm run build
\`\`\`

### Development Mode

\`\`\`bash
npm run build:watch
\`\`\`

## License

MIT License
`;

  writeFileSync(join(packagePath, "README.md"), readme);

  console.log("\x1b[32m[*]\x1b[0m Package created successfully!");
  console.log(`\x1b[36m[CadixMod]\x1b[0m Location: ${packagePath}`);
}

packageApp();
