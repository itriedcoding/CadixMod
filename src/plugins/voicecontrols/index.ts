// CadixMod Plugin: Voice Controls
// Enhanced voice channel controls with overlay

import type { Plugin } from "../../shared/types";
import { logger } from "../../utils/logger";
import { Webpack } from "../../renderer/webpack";
import { showToast } from "../../renderer/ui";

const OVERLAY_ID = "cadixmod-voice-overlay";
const CHECK_INTERVAL = 2000;

let checkTimer: ReturnType<typeof setInterval> | null = null;
let overlayElement: HTMLDivElement | null = null;

interface VoiceStateStore {
  getState: () => {
    voiceStates: Record<string, {
      userId: string;
      channelId: string;
      guildId: string | null;
      selfMute: boolean;
      selfDeaf: boolean;
      mute: boolean;
      deaf: boolean;
    }>;
  };
}

interface VoiceActions {
  toggleSelfMute: () => void;
  toggleSelfDeaf: () => void;
  disconnect: () => void;
}

interface ChannelStore {
  getChannel: (id: string) => { id: string; name: string; guild_id: string } | null;
}

interface UserStore {
  getCurrentUser: () => { id: string; username: string } | null;
}

function getVoiceStateStore(): VoiceStateStore | null {
  const mod = Webpack.findByStoreName("VoiceStateStore");
  if (!mod?.default) return null;
  try {
    return new (mod.default as new () => VoiceStateStore)();
  } catch {
    return null;
  }
}

function getChannelStore(): ChannelStore | null {
  const mod = Webpack.findByStoreName("ChannelStore");
  if (!mod?.default) return null;
  try {
    return new (mod.default as new () => ChannelStore)();
  } catch {
    return null;
  }
}

function getUserStore(): UserStore | null {
  const mod = Webpack.findByStoreName("UserStore");
  if (!mod?.default) return null;
  try {
    return new (mod.default as new () => UserStore)();
  } catch {
    return null;
  }
}

function getVoiceActions(): VoiceActions | null {
  const mod = Webpack.findByProps("toggleSelfMute", "toggleSelfDeaf");
  if (!mod) return null;
  return mod as unknown as VoiceActions;
}

function getMediaEngineActions(): { setLocalVolume: (userId: string, volume: number) => void } | null {
  const mod = Webpack.findByProps("setLocalVolume");
  if (!mod) return null;
  return mod as unknown as { setLocalVolume: (userId: string, volume: number) => void };
}

function getCurrentVoiceChannelId(): string | null {
  const userStore = getUserStore();
  const voiceStateStore = getVoiceStateStore();
  if (!userStore || !voiceStateStore) return null;

  const user = userStore.getCurrentUser();
  if (!user) return null;

  const state = voiceStateStore.getState();
  const voiceState = state.voiceStates[user.id];
  return voiceState?.channelId || null;
}

function getChannelName(channelId: string): string {
  const channelStore = getChannelStore();
  if (!channelStore) return "Unknown Channel";
  const channel = channelStore.getChannel(channelId);
  return channel?.name || "Unknown Channel";
}

function createSVGIcon(path: string, size = 18): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">${path}</svg>`;
}

const MIC_ICON = "M12 2C10.34 2 9 3.34 9 5V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V5C15 3.34 13.66 2 12 2ZM17.3 10C17.3 12.91 14.91 15.3 12 15.3C9.09 15.3 6.7 12.91 6.7 10H5C5 13.53 7.61 16.43 11 16.93V21H13V16.93C16.39 16.43 19 13.53 19 10H17.3Z";
const MIC_OFF_ICON = "M12 2C10.34 2 9 3.34 9 5V5.17L17.83 14H17V15C17 16.66 15.66 18 14 18C13.04 18 12.18 17.55 11.63 16.83L10.12 18.34C11.04 19.41 12.44 20 14 20C16.76 20 19 17.76 19 15V5C19 3.34 17.66 2 16 2C14.34 2 13 3.34 13 5V12.17L12 11.17V5C12 3.34 10.66 2 9 2H12ZM3.41 1.58L2 3L6.17 7.17L5 8.34V15C5 16.66 6.34 18 8 18C8.55 18 9.07 17.84 9.51 17.55L10.97 19.01C10.19 19.63 9.14 20 8 20C5.24 20 3 17.76 3 15V8.34L1.59 6.93L3.41 1.58Z";
const DEAF_ICON = "M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22C17.52 22 22 17.52 22 12S17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12S7.58 4 12 4C16.42 4 20 7.58 20 12S16.42 20 12 20ZM6 14L8 16V12L6 14ZM18 14L16 16V12L18 14ZM9 10V14H15V10H9Z";
const DEAF_OFF_ICON = "M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22C17.52 22 22 17.52 22 12S17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12S7.58 4 12 4C16.42 4 20 7.58 20 12S16.42 20 12 20ZM6 14L8 16V12L6 14ZM18 14L16 16V12L18 14Z";
const DISCONNECT_ICON = "M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22C17.52 22 22 17.52 22 12S17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12S7.58 4 12 4C16.42 4 20 7.58 20 12S16.42 20 12 20ZM17 13L12 18L7 13H10V9H14V13H17Z";

function createOverlay(): void {
  if (overlayElement) return;

  overlayElement = document.createElement("div");
  overlayElement.id = OVERLAY_ID;

  overlayElement.innerHTML = `
    <div class="cadixmod-voice-overlay-inner">
      <div class="cadixmod-voice-channel-name" id="cadixmod-voice-channel-name">Connecting...</div>
      <div class="cadixmod-voice-controls">
        <button class="cadixmod-voice-btn" id="cadixmod-voice-mute" title="Toggle Mute">
          ${createSVGIcon(MIC_ICON)}
        </button>
        <button class="cadixmod-voice-btn" id="cadixmod-voice-deaf" title="Toggle Deafen">
          ${createSVGIcon(DEAF_ICON)}
        </button>
        <button class="cadixmod-voice-btn cadixmod-voice-btn-danger" id="cadixmod-voice-disconnect" title="Disconnect">
          ${createSVGIcon(DISCONNECT_ICON)}
        </button>
      </div>
      <div class="cadixmod-voice-volume">
        <span style="color: #b5bac1; font-size: 11px;">Volume</span>
        <input type="range" id="cadixmod-voice-volume-slider" min="0" max="200" value="100" style="width: 80px; accent-color: #5865f2;">
      </div>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #${OVERLAY_ID} {
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 99999;
      animation: cadixmod-fade-in 0.2s ease-out;
    }
    .cadixmod-voice-overlay-inner {
      background: #2b2d31;
      border-radius: 12px;
      padding: 12px 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      min-width: 180px;
    }
    .cadixmod-voice-channel-name {
      color: #f2f3f5;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }
    .cadixmod-voice-controls {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 8px;
    }
    .cadixmod-voice-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: #404249;
      color: #b5bac1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .cadixmod-voice-btn:hover {
      background: #5865f2;
      color: white;
    }
    .cadixmod-voice-btn.active {
      background: #da373c;
      color: white;
    }
    .cadixmod-voice-btn-danger:hover {
      background: #da373c;
    }
    .cadixmod-voice-volume {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
    }
    .cadixmod-voice-volume input[type="range"] {
      height: 4px;
      cursor: pointer;
    }
  `;
  overlayElement.appendChild(style);

  document.body.appendChild(overlayElement);

  const voiceActions = getVoiceActions();

  overlayElement.querySelector("#cadixmod-voice-mute")?.addEventListener("click", () => {
    voiceActions?.toggleSelfMute();
    updateOverlay();
  });

  overlayElement.querySelector("#cadixmod-voice-deaf")?.addEventListener("click", () => {
    voiceActions?.toggleSelfDeaf();
    updateOverlay();
  });

  overlayElement.querySelector("#cadixmod-voice-disconnect")?.addEventListener("click", () => {
    voiceActions?.disconnect();
    removeOverlay();
  });

  overlayElement.querySelector("#cadixmod-voice-volume-slider")?.addEventListener("input", (e) => {
    const value = parseInt((e.target as HTMLInputElement).value, 10);
    const userStore = getUserStore();
    const user = userStore?.getCurrentUser();
    if (user) {
      const actions = getMediaEngineActions();
      actions?.setLocalVolume(user.id, value);
    }
  });

  updateOverlay();
}

function updateOverlay(): void {
  const channelId = getCurrentVoiceChannelId();
  const channelNameEl = overlayElement?.querySelector("#cadixmod-voice-channel-name") as HTMLElement;
  const muteBtn = overlayElement?.querySelector("#cadixmod-voice-mute") as HTMLButtonElement;
  const deafBtn = overlayElement?.querySelector("#cadixmod-voice-deaf") as HTMLButtonElement;

  if (!channelId) {
    removeOverlay();
    return;
  }

  if (channelNameEl) {
    channelNameEl.textContent = getChannelName(channelId);
  }

  const userStore = getUserStore();
  const voiceStateStore = getVoiceStateStore();
  if (!userStore || !voiceStateStore) return;

  const user = userStore.getCurrentUser();
  if (!user) return;

  const state = voiceStateStore.getState();
  const voiceState = state.voiceStates[user.id];

  if (muteBtn) {
    const isMuted = voiceState?.selfMute || false;
    muteBtn.classList.toggle("active", isMuted);
    muteBtn.innerHTML = createSVGIcon(isMuted ? MIC_OFF_ICON : MIC_ICON);
    muteBtn.title = isMuted ? "Unmute" : "Mute";
  }

  if (deafBtn) {
    const isDeaf = voiceState?.selfDeaf || false;
    deafBtn.classList.toggle("active", isDeaf);
    deafBtn.innerHTML = createSVGIcon(isDeaf ? DEAF_OFF_ICON : DEAF_ICON);
    deafBtn.title = isDeaf ? "Undeafen" : "Deafen";
  }
}

function removeOverlay(): void {
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
}

function checkVoiceState(): void {
  const channelId = getCurrentVoiceChannelId();
  if (channelId && !overlayElement) {
    createOverlay();
  } else if (!channelId && overlayElement) {
    removeOverlay();
  } else if (channelId && overlayElement) {
    updateOverlay();
  }
}

const plugin: Plugin = {
  id: "voicecontrols",
  name: "VoiceControls",
  description: "Enhanced voice channel controls",
  version: "1.0.0",
  author: "CadixMod",
  patches: [],

  start() {
    logger.debug("VoiceControls started");
    checkTimer = setInterval(checkVoiceState, CHECK_INTERVAL);
    checkVoiceState();
  },

  stop() {
    logger.debug("VoiceControls stopped");
    if (checkTimer) {
      clearInterval(checkTimer);
      checkTimer = null;
    }
    removeOverlay();
  },
};

export default plugin;
