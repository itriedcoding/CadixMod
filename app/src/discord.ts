import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";
import { homedir, platform } from "os";

export interface DiscordInstallation {
  name: string;
  path: string;
  resourcesPath: string;
  asarPath: string;
  isPatched: boolean;
  version: string;
  channel: string;
}

const CHANNELS = ["stable", "ptb", "canary", "dev"];

function getDiscordPaths(): string[] {
  const plat = platform();
  const home = homedir();

  const paths: string[] = [];

  switch (plat) {
    case "win32":
      for (const channel of CHANNELS) {
        const localAppData = process.env.LOCALAPPDATA || join(home, "AppData", "Local");
        paths.push(join(localAppData, `Discord${channel === "stable" ? "" : channel.charAt(0).toUpperCase() + channel.slice(1)}`));
        const appData = process.env.APPDATA || join(home, "AppData", "Roaming");
        paths.push(join(appData, `Discord${channel === "stable" ? "" : channel.charAt(0).toUpperCase() + channel.slice(1)}`));
      }
      break;

    case "linux":
      paths.push(
        join(home, ".config", "discord"),
        join(home, ".config", "discordptb"),
        join(home, ".config", "discordcanary"),
        "/usr/lib/discord",
        "/usr/lib/discord-ptb",
        "/usr/lib/discord-canary",
        "/opt/Discord",
        "/opt/DiscordPTB",
        "/opt/DiscordCanary",
        "/snap/discord/current",
        "/snap/discord-ptb/current",
        "/snap/discord-canary/current"
      );
      break;

    case "darwin":
      for (const channel of CHANNELS) {
        const name = channel === "stable" ? "Discord" : `Discord${channel.charAt(0).toUpperCase() + channel.slice(1)}`;
        paths.push(`/Applications/${name}.app/Contents/Resources`);
        paths.push(join(home, "Library", "Application Support", name.toLowerCase()));
      }
      break;
  }

  return [...new Set(paths)];
}

function getDiscordChannel(installPath: string): string {
  const name = basename(installPath).toLowerCase();
  if (name.includes("ptb")) return "ptb";
  if (name.includes("canary")) return "canary";
  if (name.includes("dev")) return "dev";
  return "stable";
}

function getDiscordVersion(resourcesPath: string): string {
  try {
    const packageJsonPath = join(resourcesPath, "..", "modules", "discord_desktop_core", "package.json");
    if (existsSync(packageJsonPath)) {
      const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      return pkg.version || "unknown";
    }
  } catch {}
  return "unknown";
}

export function detectDiscord(): DiscordInstallation[] {
  const installations: DiscordInstallation[] = [];
  const paths = getDiscordPaths();

  for (const discordPath of paths) {
    if (!existsSync(discordPath)) continue;

    const plat = platform();
    let resourcesPath: string;

    if (plat === "darwin") {
      resourcesPath = discordPath;
    } else {
      resourcesPath = join(discordPath, "resources");
    }

    const asarPath = join(resourcesPath, "app.asar");
    const backupPath = join(resourcesPath, "app.asar.backup");

    if (!existsSync(asarPath)) continue;

    const isPatched = existsSync(backupPath);
    const channel = getDiscordChannel(discordPath);
    const version = getDiscordVersion(resourcesPath);

    installations.push({
      name: basename(discordPath),
      path: discordPath,
      resourcesPath,
      asarPath,
      isPatched,
      version,
      channel,
    });
  }

  return installations;
}

export function isDiscordRunning(): boolean {
  const plat = platform();

  try {
    const { execSync } = require("child_process");

    switch (plat) {
      case "win32":
        const output = execSync("tasklist /FI \"IMAGENAME eq Discord.exe\" /NH", { encoding: "utf-8" });
        return output.includes("Discord.exe");

      case "linux":
        execSync("pgrep -x discord", { encoding: "utf-8" });
        return true;

      case "darwin":
        execSync("pgrep -x Discord", { encoding: "utf-8" });
        return true;

      default:
        return false;
    }
  } catch {
    return false;
  }
}

export function killDiscord(): void {
  const plat = platform();

  try {
    const { execSync } = require("child_process");

    switch (plat) {
      case "win32":
        execSync("taskkill /F /IM Discord.exe", { encoding: "utf-8" });
        break;
      case "linux":
        execSync("pkill -x discord", { encoding: "utf-8" });
        break;
      case "darwin":
        execSync("pkill -x Discord", { encoding: "utf-8" });
        break;
    }
  } catch {}
}

export function launchDiscord(installation: DiscordInstallation): void {
  const { spawn } = require("child_process");
  const plat = platform();

  let executablePath: string;

  switch (plat) {
    case "win32":
      executablePath = join(installation.path, "Discord.exe");
      break;
    case "linux":
      executablePath = join(installation.path, "Discord");
      break;
    case "darwin":
      executablePath = `/Applications/${installation.name}.app/Contents/MacOS/${installation.name}`;
      break;
    default:
      throw new Error("Unsupported platform");
  }

  if (existsSync(executablePath)) {
    spawn(executablePath, [], {
      detached: true,
      stdio: "ignore",
    }).unref();
  }
}
