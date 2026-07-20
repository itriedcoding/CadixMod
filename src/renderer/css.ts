// CadixMod CSS Injection - Manages injected styles

const STYLE_ID = "cadixmod-styles";

const CADIXMOD_CSS = `
  /* CadixMod Base Styles */

  #cadixmod-settings-btn {
    cursor: pointer;
    transition: opacity 0.2s;
  }

  #cadixmod-settings-btn:hover {
    opacity: 0.8;
  }

  .cadixmod-badge {
    display: inline-block;
    background: linear-gradient(135deg, #7289da, #5b6eae);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 600;
    margin-left: 8px;
    vertical-align: middle;
  }

  /* Settings Panel */
  .cadixmod-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: cadixmod-fade-in 0.2s ease;
  }

  @keyframes cadixmod-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .cadixmod-panel {
    width: 600px;
    max-width: 90vw;
    max-height: 80vh;
    background: #36393f;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: cadixmod-slide-in 0.3s ease;
  }

  @keyframes cadixmod-slide-in {
    from { 
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .cadixmod-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #202225;
    background: #2f3136;
  }

  .cadixmod-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #fff;
  }

  .cadixmod-close {
    background: none;
    border: none;
    color: #72767d;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    transition: color 0.2s;
  }

  .cadixmod-close:hover {
    color: #fff;
  }

  .cadixmod-tabs {
    display: flex;
    padding: 0 16px;
    background: #2f3136;
    border-bottom: 1px solid #202225;
  }

  .cadixmod-tab {
    padding: 12px 16px;
    background: none;
    border: none;
    color: #72767d;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    position: relative;
    transition: color 0.2s;
  }

  .cadixmod-tab:hover {
    color: #dcddde;
  }

  .cadixmod-tab.active {
    color: #fff;
  }

  .cadixmod-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: #7289da;
  }

  .cadixmod-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  .cadixmod-tab-content {
    display: none;
  }

  .cadixmod-tab-content.active {
    display: block;
  }

  .cadixmod-section {
    margin-bottom: 24px;
  }

  .cadixmod-section h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #b9bbbe;
    text-transform: uppercase;
  }

  /* Toggle Switch */
  .cadixmod-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    cursor: pointer;
    color: #dcddde;
  }

  .cadixmod-toggle input {
    width: 40px;
    height: 20px;
    appearance: none;
    background: #72767d;
    border-radius: 10px;
    position: relative;
    cursor: pointer;
    transition: background 0.2s;
  }

  .cadixmod-toggle input::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
  }

  .cadixmod-toggle input:checked {
    background: #43b581;
  }

  .cadixmod-toggle input:checked::before {
    transform: translateX(20px);
  }

  /* Plugin List */
  .cadixmod-plugin-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cadixmod-plugin {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #2f3136;
    border-radius: 6px;
    transition: background 0.2s;
  }

  .cadixmod-plugin:hover {
    background: #34373c;
  }

  .cadixmod-plugin-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .cadixmod-plugin-name {
    font-weight: 600;
    color: #fff;
  }

  .cadixmod-plugin-desc {
    font-size: 13px;
    color: #b9bbbe;
  }

  .cadixmod-plugin-version {
    font-size: 11px;
    color: #72767d;
  }

  /* Switch Toggle */
  .cadixmod-switch {
    position: relative;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
  }

  .cadixmod-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .cadixmod-slider {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #72767d;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .cadixmod-slider::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
  }

  .cadixmod-switch input:checked + .cadixmod-slider {
    background: #43b581;
  }

  .cadixmod-switch input:checked + .cadixmod-slider::before {
    transform: translateX(20px);
  }

  /* Select */
  .cadixmod-select {
    width: 100%;
    padding: 10px 12px;
    background: #202225;
    border: 1px solid #202225;
    border-radius: 4px;
    color: #dcddde;
    font-size: 14px;
    cursor: pointer;
  }

  .cadixmod-select:focus {
    outline: none;
    border-color: #7289da;
  }

  /* Textarea */
  .cadixmod-section textarea {
    width: 100%;
    padding: 12px;
    background: #202225;
    border: 1px solid #202225;
    border-radius: 4px;
    color: #dcddde;
    font-family: 'Consolas', monospace;
    font-size: 13px;
    resize: vertical;
    box-sizing: border-box;
  }

  .cadixmod-section textarea:focus {
    outline: none;
    border-color: #7289da;
  }

  /* Buttons */
  .cadixmod-button {
    padding: 8px 16px;
    background: #7289da;
    border: none;
    border-radius: 4px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    margin-right: 8px;
  }

  .cadixmod-button:hover {
    background: #677bc4;
  }

  .cadixmod-button.cadixmod-danger {
    background: #ed4245;
  }

  .cadixmod-button.cadixmod-danger:hover {
    background: #c93b3e;
  }
`;

let styleElement: HTMLStyleElement | null = null;

export function injectCSS(): void {
  if (styleElement) return;

  styleElement = document.createElement("style");
  styleElement.id = STYLE_ID;
  styleElement.textContent = CADIXMOD_CSS;
  document.head.appendChild(styleElement);
}

export function removeCSS(): void {
  styleElement?.remove();
  styleElement = null;
}

export function updateCSS(css: string): void {
  if (styleElement) {
    styleElement.textContent = CADIXMOD_CSS + "\n" + css;
  }
}
