// State Manager simples
window.StateManager = new (class {
  constructor() { this.config = null; }
  async load() {
    const result = await chrome.storage.sync.get(['userConfig']);
    this.config = result.userConfig || { automation: false, value: 10, period: 0, minPayout: 80 };
    return this.config;
  }
  getConfig() { return this.config; }
  async saveConfig(cfg) {
    this.config = { ...this.config, ...cfg };
    await chrome.storage.sync.set({ userConfig: this.config });
    return true;
  }
})();
