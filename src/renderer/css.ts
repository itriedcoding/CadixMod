const CADIXMOD_STYLES_ID = "cadixmod-styles";

const CADIXMOD_CSS = `
/* CadixMod Base Styles */
#cadixmod-settings-button {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5865f2, #eb459e);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: cadixmod-spin-in 0.3s ease-out;
}

#cadixmod-settings-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

#cadixmod-settings-button:active {
  transform: scale(0.95);
}

#cadixmod-settings-button svg {
  width: 22px;
  height: 22px;
  fill: white;
  transition: transform 0.3s ease;
}

#cadixmod-settings-button:hover svg {
  transform: rotate(90deg);
}

@keyframes cadixmod-spin-in {
  from {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  to {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* Settings Panel */
.cadixmod-settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  z-index: 99998;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: cadixmod-fade-in 0.2s ease-out;
}

.cadixmod-settings-panel {
  background: #313338;
  border-radius: 12px;
  width: 700px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  animation: cadixmod-scale-in 0.2s ease-out;
  display: flex;
  flex-direction: column;
}

.cadixmod-settings-header {
  padding: 20px 24px;
  background: #2b2d31;
  border-bottom: 1px solid #1e1f22;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cadixmod-settings-header h2 {
  margin: 0;
  color: #f2f3f5;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.cadixmod-settings-header .cadixmod-logo {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #5865f2, #eb459e);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: white;
}

.cadixmod-settings-close {
  background: none;
  border: none;
  color: #b5bac1;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}

.cadixmod-settings-close:hover {
  color: #f2f3f5;
  background: #404249;
}

.cadixmod-settings-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.cadixmod-settings-sidebar {
  width: 200px;
  background: #2b2d31;
  border-right: 1px solid #1e1f22;
  padding: 16px 8px;
  overflow-y: auto;
}

.cadixmod-settings-nav-item {
  padding: 10px 12px;
  border-radius: 6px;
  color: #b5bac1;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 4px;
  transition: background 0.15s, color 0.15s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.cadixmod-settings-nav-item:hover {
  background: #404249;
  color: #f2f3f5;
}

.cadixmod-settings-nav-item.active {
  background: #404249;
  color: #f2f3f5;
  font-weight: 500;
}

.cadixmod-settings-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.cadixmod-settings-section {
  margin-bottom: 24px;
}

.cadixmod-settings-section h3 {
  color: #f2f3f5;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.cadixmod-settings-section p {
  color: #b5bac1;
  font-size: 13px;
  margin: 0 0 16px 0;
}

.cadixmod-setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #1e1f22;
}

.cadixmod-setting-row:last-child {
  border-bottom: none;
}

.cadixmod-setting-label {
  color: #f2f3f5;
  font-size: 14px;
}

.cadixmod-setting-description {
  color: #b5bac1;
  font-size: 12px;
  margin-top: 2px;
}

/* Toggle Switch */
.cadixmod-toggle {
  position: relative;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.cadixmod-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.cadixmod-toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #4e5058;
  border-radius: 12px;
  transition: background 0.2s;
}

.cadixmod-toggle-slider::before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.cadixmod-toggle input:checked + .cadixmod-toggle-slider {
  background: #23a55a;
}

.cadixmod-toggle input:checked + .cadixmod-toggle-slider::before {
  transform: translateX(20px);
}

/* Toast Container */
.cadixmod-toast-container {
  position: fixed;
  bottom: 80px;
  left: 20px;
  z-index: 100000;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  pointer-events: none;
}

.cadixmod-toast {
  background: #2b2d31;
  border-radius: 8px;
  padding: 12px 16px;
  min-width: 300px;
  max-width: 400px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  animation: cadixmod-toast-in 0.3s ease-out;
  pointer-events: all;
  border-left: 4px solid #5865f2;
}

.cadixmod-toast.cadixmod-toast-info {
  border-left-color: #5865f2;
}

.cadixmod-toast.cadixmod-toast-success {
  border-left-color: #23a55a;
}

.cadixmod-toast.cadixmod-toast-warning {
  border-left-color: #f0b232;
}

.cadixmod-toast.cadixmod-toast-error {
  border-left-color: #da373c;
}

.cadixmod-toast-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.cadixmod-toast-body {
  flex: 1;
  min-width: 0;
}

.cadixmod-toast-title {
  color: #f2f3f5;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 2px 0;
}

.cadixmod-toast-content {
  color: #b5bac1;
  font-size: 13px;
  margin: 0;
}

.cadixmod-toast-close {
  background: none;
  border: none;
  color: #b5bac1;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  flex-shrink: 0;
  transition: color 0.15s;
}

.cadixmod-toast-close:hover {
  color: #f2f3f5;
}

.cadixmod-toast.cadixmod-toast-exiting {
  animation: cadixmod-toast-out 0.2s ease-in forwards;
}

@keyframes cadixmod-toast-in {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes cadixmod-toast-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}

@keyframes cadixmod-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes cadixmod-scale-in {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Modal */
.cadixmod-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  z-index: 99997;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: cadixmod-fade-in 0.2s ease-out;
}

.cadixmod-modal {
  background: #313338;
  border-radius: 12px;
  width: 440px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  animation: cadixmod-scale-in 0.2s ease-out;
}

.cadixmod-modal-header {
  padding: 20px 24px 0;
}

.cadixmod-modal-header h3 {
  margin: 0;
  color: #f2f3f5;
  font-size: 18px;
  font-weight: 600;
}

.cadixmod-modal-body {
  padding: 16px 24px;
  color: #dbdee1;
  font-size: 14px;
  line-height: 1.5;
}

.cadixmod-modal-footer {
  padding: 12px 24px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cadixmod-modal-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}

.cadixmod-modal-btn:hover {
  opacity: 0.9;
}

.cadixmod-modal-btn-primary {
  background: #5865f2;
  color: white;
}

.cadixmod-modal-btn-secondary {
  background: #4e5058;
  color: #f2f3f5;
}

.cadixmod-modal-btn-danger {
  background: #da373c;
  color: white;
}

/* Nav Items */
.cadixmod-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #313338;
  cursor: pointer;
  transition: border-radius 0.2s, background 0.2s;
  margin-bottom: 8px;
}

.cadixmod-nav-item:hover {
  border-radius: 12px;
  background: #5865f2;
}

.cadixmod-nav-item.active {
  border-radius: 12px;
  background: #5865f2;
}

.cadixmod-nav-item svg {
  width: 24px;
  height: 24px;
  fill: #b5bac1;
  transition: fill 0.2s;
}

.cadixmod-nav-item:hover svg,
.cadixmod-nav-item.active svg {
  fill: white;
}

.cadixmod-nav-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #da373c;
  color: white;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cadixmod-nav-pill {
  position: absolute;
  left: -16px;
  width: 4px;
  height: 0;
  background: white;
  border-radius: 0 4px 4px 0;
  transition: height 0.2s;
}

.cadixmod-nav-item:hover .cadixmod-nav-pill {
  height: 20px;
}

.cadixmod-nav-item.active .cadixmod-nav-pill {
  height: 40px;
}

/* Badge */
.cadixmod-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #5865f2, #eb459e);
}

/* Plugin List Items */
.cadixmod-plugin-item {
  padding: 12px 16px;
  background: #2b2d31;
  border-radius: 8px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.cadixmod-plugin-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #404249;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.cadixmod-plugin-info {
  flex: 1;
  min-width: 0;
}

.cadixmod-plugin-name {
  color: #f2f3f5;
  font-size: 14px;
  font-weight: 500;
}

.cadixmod-plugin-desc {
  color: #b5bac1;
  font-size: 12px;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cadixmod-plugin-version {
  color: #80848e;
  font-size: 11px;
  margin-top: 2px;
}

/* Input Styles */
.cadixmod-input {
  background: #1e1f22;
  border: 1px solid #1e1f22;
  border-radius: 6px;
  padding: 8px 12px;
  color: #f2f3f5;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}

.cadixmod-input:focus {
  border-color: #5865f2;
}

.cadixmod-input::placeholder {
  color: #72767d;
}

/* Scrollbar */
.cadixmod-settings-content::-webkit-scrollbar,
.cadixmod-settings-sidebar::-webkit-scrollbar {
  width: 8px;
}

.cadixmod-settings-content::-webkit-scrollbar-track,
.cadixmod-settings-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.cadixmod-settings-content::-webkit-scrollbar-thumb,
.cadixmod-settings-sidebar::-webkit-scrollbar-thumb {
  background: #1e1f22;
  border-radius: 4px;
}

.cadixmod-settings-content::-webkit-scrollbar-thumb:hover,
.cadixmod-settings-sidebar::-webkit-scrollbar-thumb:hover {
  background: #141517;
}
`;

let styleElement: HTMLStyleElement | null = null;

export function injectStyles(): void {
  if (!document.getElementById(CADIXMOD_STYLES_ID)) {
    styleElement = document.createElement("style");
    styleElement.id = CADIXMOD_STYLES_ID;
    styleElement.textContent = CADIXMOD_CSS;
    document.head.appendChild(styleElement);
  }
}

export function removeStyles(): void {
  const existing = document.getElementById(CADIXMOD_STYLES_ID);
  if (existing) {
    existing.remove();
  }
  styleElement = null;
}

export function updateStyles(newCss: string): void {
  let el = document.getElementById(CADIXMOD_STYLES_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = CADIXMOD_STYLES_ID;
    document.head.appendChild(el);
  }
  el.textContent = CADIXMOD_CSS + "\n" + newCss;
  styleElement = el;
}

export function getStylesElement(): HTMLStyleElement | null {
  return styleElement;
}

export { CADIXMOD_CSS };
