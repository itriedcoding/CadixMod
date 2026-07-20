// CadixMod Plugin: Custom CSS
// Full custom CSS editor with live preview

import type { Plugin } from "../../shared/types";
import { logger } from "../../utils/logger";
import { updateStyles } from "../../renderer/css";

const STORAGE_KEY = "cadixmod_custom_css";

function getSavedCSS(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function saveCSS(css: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, css);
  } catch (err) {
    logger.error("Failed to save custom CSS:", err);
  }
}

let overlayElement: HTMLDivElement | null = null;
let styleElement: HTMLStyleElement | null = null;

function applyLivePreview(css: string): void {
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = "cadixmod-custom-css-live";
    document.head.appendChild(styleElement);
  }
  styleElement.textContent = css;
}

function removeLivePreview(): void {
  if (styleElement) {
    styleElement.remove();
    styleElement = null;
  }
}

function openEditor(): void {
  if (overlayElement) return;

  const savedCSS = getSavedCSS();

  overlayElement = document.createElement("div");
  overlayElement.className = "cadixmod-modal-overlay";

  const modal = document.createElement("div");
  modal.className = "cadixmod-modal";
  modal.style.width = "700px";
  modal.style.maxWidth = "90vw";
  modal.style.height = "70vh";

  modal.innerHTML = `
    <div class="cadixmod-modal-header">
      <h3>Custom CSS Editor</h3>
    </div>
    <div class="cadixmod-modal-body" style="padding: 0 16px 16px; display: flex; flex-direction: column; height: calc(100% - 110px);">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #b5bac1; font-size: 12px;">Live preview is active as you type</span>
        <span id="cadixmod-css-status" style="color: #80848e; font-size: 12px;"></span>
      </div>
      <textarea id="cadixmod-css-editor" style="
        flex: 1;
        width: 100%;
        background: #1e1f22;
        border: 1px solid #1e1f22;
        border-radius: 6px;
        padding: 12px;
        color: #dbdee1;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.5;
        resize: none;
        outline: none;
        tab-size: 2;
        white-space: pre;
        overflow: auto;
      " spellcheck="false" placeholder="/* Enter your custom CSS here */">${escapeHTML(savedCSS)}</textarea>
    </div>
    <div class="cadixmod-modal-footer">
      <button class="cadixmod-modal-btn cadixmod-modal-btn-secondary" id="cadixmod-css-reset">Reset</button>
      <button class="cadixmod-modal-btn cadixmod-modal-btn-secondary" id="cadixmod-css-cancel">Cancel</button>
      <button class="cadixmod-modal-btn cadixmod-modal-btn-primary" id="cadixmod-css-save">Save & Apply</button>
    </div>
  `;

  overlayElement.appendChild(modal);
  document.body.appendChild(overlayElement);

  const textarea = modal.querySelector("#cadixmod-css-editor") as HTMLTextAreaElement;
  const statusEl = modal.querySelector("#cadixmod-css-status") as HTMLElement;

  applyLivePreview(savedCSS);
  if (savedCSS) {
    statusEl.textContent = "Previewing saved CSS";
  }

  textarea.addEventListener("input", () => {
    const value = textarea.value;
    applyLivePreview(value);
    if (value.trim()) {
      statusEl.textContent = "Previewing unsaved changes";
      statusEl.style.color = "#f0b232";
    } else {
      statusEl.textContent = "";
    }
  });

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + "  " + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      textarea.dispatchEvent(new Event("input"));
    }
  });

  const saveBtn = modal.querySelector("#cadixmod-css-save");
  saveBtn?.addEventListener("click", () => {
    const css = textarea.value;
    saveCSS(css);
    applyLivePreview(css);
    removeLivePreview();
    updateStyles(css);
    statusEl.textContent = "Saved!";
    statusEl.style.color = "#23a55a";
    setTimeout(() => closeEditor(), 500);
  });

  const cancelBtn = modal.querySelector("#cadixmod-css-cancel");
  cancelBtn?.addEventListener("click", () => {
    removeLivePreview();
    const currentSaved = getSavedCSS();
    if (currentSaved) {
      updateStyles(currentSaved);
    }
    closeEditor();
  });

  const resetBtn = modal.querySelector("#cadixmod-css-reset");
  resetBtn?.addEventListener("click", () => {
    textarea.value = "";
    textarea.dispatchEvent(new Event("input"));
    removeLivePreview();
    updateStyles("");
  });

  overlayElement.addEventListener("click", (e) => {
    if (e.target === overlayElement) {
      removeLivePreview();
      const currentSaved = getSavedCSS();
      if (currentSaved) {
        updateStyles(currentSaved);
      }
      closeEditor();
    }
  });
}

function closeEditor(): void {
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
}

function escapeHTML(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

const plugin: Plugin = {
  id: "customcss",
  name: "CustomCSS",
  description: "Full custom CSS editor with live preview",
  version: "1.0.0",
  author: "CadixMod",
  patches: [],

  start() {
    logger.debug("CustomCSS plugin started");

    const savedCSS = getSavedCSS();
    if (savedCSS) {
      updateStyles(savedCSS);
    }
  },

  stop() {
    logger.debug("CustomCSS plugin stopped");
    closeEditor();
    removeLivePreview();
  },
};

export default plugin;
