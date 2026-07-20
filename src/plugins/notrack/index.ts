// CadixMod Plugin: NoTrack
// Blocks Discord telemetry, analytics, and Sentry error reporting

import type { Plugin } from "../../shared/types";
import { logger } from "../../utils/logger";

let originalFetch: typeof fetch | null = null;
let originalXHROpen: typeof XMLHttpRequest.prototype.open | null = null;
let originalXHRSend: typeof XMLHttpRequest.prototype.send | null = null;
let sentryHub: { close: () => void; captureException: () => string; getStacktrace?: () => unknown } | null = null;

const BLOCKED_HOSTS = new Set([
  "sentry.io",
  "sentry.discord.com",
  "sentry-next.discord.com",
  "discordanalytics.com",
  "analytics.discord.com",
  "api.analytics.discord.com",
  "status.discord.com",
  "cdn.discordanalytics.com",
]);

const BLOCKED_PATHS = [
  "/api/v9/science",
  "/api/v9/experiments",
  "/api/v9/track",
  "/api/v9/analytics",
  "/__webpack_hmr",
  "/sentry",
  "/api/v9/harvest",
  "/api/v9/interactions",
];

const BLOCKED_SCRIPTS = [
  "sentry",
  "analytics",
  "track",
  "telemetry",
  "segment",
  "amplitude",
  "mixpanel",
  "google-analytics",
  "googletagmanager",
  "gtag",
];

function isBlockedURL(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);

    for (const host of BLOCKED_HOSTS) {
      if (parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)) {
        return true;
      }
    }

    for (const path of BLOCKED_PATHS) {
      if (parsed.pathname.startsWith(path)) {
        return true;
      }
    }

    const lowerUrl = url.toLowerCase();
    for (const script of BLOCKED_SCRIPTS) {
      if (lowerUrl.includes(script)) {
        return true;
      }
    }
  } catch {
    // If URL parsing fails, allow it
  }

  return false;
}

function patchFetch(): void {
  if (originalFetch) return;
  originalFetch = window.fetch;

  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    if (isBlockedURL(url)) {
      logger.debug(`[NoTrack] Blocked fetch: ${url}`);
      return Promise.resolve(new Response("", { status: 204, statusText: "No Content" }));
    }

    return originalFetch!.call(window, input, init);
  };
}

function patchXHR(): void {
  if (originalXHROpen) return;
  originalXHROpen = XMLHttpRequest.prototype.open;
  originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...args: unknown[]): void {
    const urlString = typeof url === "string" ? url : url.toString();

    if (isBlockedURL(urlString)) {
      (this as Record<string, unknown>)._cadixmod_blocked = true;
      logger.debug(`[NoTrack] Blocked XHR: ${urlString}`);
      return;
    }

    return originalXHROpen!.call(this, method, url, ...args);
  };

  XMLHttpRequest.prototype.send = function (...args: unknown[]): void {
    if ((this as Record<string, unknown>)._cadixmod_blocked) {
      return;
    }
    return originalXHRSend!.call(this, ...args);
  };
}

function blockSentry(): void {
  try {
    const w = window as Record<string, unknown>;

    if (w.Sentry) {
      const hub = w.Sentry;
      if (typeof (hub as Record<string, Function>).close === "function") {
        (hub as { close: () => void }).close();
        sentryHub = hub as { close: () => void; captureException: () => string };
        logger.debug("[NoTrack] Closed Sentry hub");
      }
    }

    if (w.__SENTRY__) {
      const sentry = w.__SENTRY__ as Record<string, unknown>;
      if (sentry.hub) {
        const hub = sentry.hub as Record<string, unknown>;
        if (typeof hub.close === "function") {
          hub.close();
        }
      }
      if (typeof sentry.globalHandlers === "object" && sentry.globalHandlers) {
        const handlers = sentry.globalHandlers as Record<string, { install: () => void; uninstall: () => void }>;
        for (const [, handler] of Object.entries(handlers)) {
          if (handler && typeof handler.uninstall === "function") {
            handler.uninstall();
          }
        }
      }
    }
  } catch (err) {
    logger.debug("[NoTrack] Sentry block error:", err);
  }
}

function blockGlobalTrackers(): void {
  const w = window as Record<string, unknown>;

  const trackerProperties = [
    "ga",
    "gtag",
    "fbq",
    "_gaq",
    "_fbq",
    "analytics",
    "amplitude",
    "mixpanel",
    "heap",
    "kissmetrics",
    "intercom",
    "drift",
    "hubspot",
    "segment",
  ];

  for (const prop of trackerProperties) {
    if (prop in w) {
      try {
        w[prop] = new Proxy(w[prop] as object, {
          get: () => undefined,
          set: () => true,
          apply: () => undefined,
          construct: () => ({}),
        });
      } catch {
        try {
          w[prop] = function () {};
        } catch {
          // Some properties may be non-configurable
        }
      }
    }
  }

  try {
    Object.defineProperty(w, "ga", { get: () => undefined, set: () => {}, configurable: false });
    Object.defineProperty(w, "gtag", { get: () => undefined, set: () => {}, configurable: false });
  } catch {
    // Already defined or not configurable
  }
}

function blockImageBeacons(): void {
  const originalImage = window.Image;

  (window as Record<string, unknown>).Image = function (
    widthOrSrc?: number | string,
    height?: number
  ) {
    if (typeof widthOrSrc === "string") {
      if (isBlockedURL(widthOrSrc)) {
        logger.debug(`[NoTrack] Blocked image beacon: ${widthOrSrc}`);
        return new originalImage(1, 1);
      }
    }
    if (widthOrSrc !== undefined && height !== undefined) {
      return new originalImage(widthOrSrc as number, height);
    }
    return new originalImage();
  } as typeof Image;

  (window.Image as Record<string, unknown>).prototype = originalImage.prototype;
  (window.Image as Record<string, unknown>).name = "Image";
}

function blockNavigatorBeacons(): void {
  if (navigator.sendBeacon) {
    const originalBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url: string | URL, data?: BodyInit | null): boolean {
      const urlString = typeof url === "string" ? url : url.toString();
      if (isBlockedURL(urlString)) {
        logger.debug(`[NoTrack] Blocked beacon: ${urlString}`);
        return true;
      }
      return originalBeacon(url, data);
    };
  }
}

function blockWebRTCLeak(): void {
  const w = window as Record<string, unknown>;

  if (w.RTCPeerConnection) {
    const OriginalPeerConnection = w.RTCPeerConnection as typeof RTCPeerConnection;

    (w as Record<string, unknown>).RTCPeerConnection = function (
      config?: RTCConfiguration,
      constraints?: unknown
    ) {
      if (config && config.iceServers) {
        config.iceServers = config.iceServers.filter((server) => {
          const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
          return urls.every((url) => {
            if (typeof url === "string") {
              return !isBlockedURL(url);
            }
            return true;
          });
        });
      }
      return new OriginalPeerConnection(config, constraints as RTCConfiguration);
    } as typeof RTCPeerConnection;

    (w.RTCPeerConnection as Record<string, unknown>).prototype = OriginalPeerConnection.prototype;
  }
}

function restoreAll(): void {
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }

  if (originalXHROpen) {
    XMLHttpRequest.prototype.open = originalXHROpen;
    originalXHROpen = null;
  }

  if (originalXHRSend) {
    XMLHttpRequest.prototype.send = originalXHRSend;
    originalXHRSend = null;
  }
}

const plugin: Plugin = {
  id: "notrack",
  name: "NoTrack",
  description: "Block Discord tracking and analytics",
  version: "1.0.0",
  author: "CadixMod",
  patches: [],

  start() {
    logger.debug("NoTrack started");

    patchFetch();
    patchXHR();
    blockSentry();
    blockGlobalTrackers();
    blockImageBeacons();
    blockNavigatorBeacons();
    blockWebRTCLeak();

    logger.info("Tracking protections activated");
  },

  stop() {
    logger.debug("NoTrack stopped");
    restoreAll();
  },
};

export default plugin;
