// State Manager Robusto - Trade Manager Core
window.StateManager = new (class {
  constructor() {
    this.config = null;
    this.state = null;
    this.listeners = new Set();
    this.storageKeys = {
      config: 'userConfig',
      state: 'systemState',
      session: 'sessionData'
    };
    this.defaultConfig = {
      automation: false,
      value: 10,
      period: 0,
      minPayout: 80,
      maxRetries: 3,
      timeout: 5000,
      theme: 'auto',
      notifications: true,
      debugMode: false,
      autoExport: false
    };
    this.defaultState = {
      isActive: false,
      currentAsset: null,
      lastUpdate: null,
      sessionId: null,
      errors: 0,
      successes: 0,
      totalOperations: 0
    };
    
    this.init();
  }

  async init() {
    try {
      await this.loadAll();
      this.logToSystem('StateManager inicializado com sucesso', 'SUCCESS', 'STATE-MANAGER');
    } catch (error) {
      this.logToSystem(`Erro ao inicializar StateManager: ${error.message}`, 'ERROR', 'STATE-MANAGER');
    }
  }

  async loadAll() {
    try {
      const result = await chrome.storage.sync.get([
        this.storageKeys.config,
        this.storageKeys.state,
        this.storageKeys.session
      ]);
      
      this.config = { ...this.defaultConfig, ...(result[this.storageKeys.config] || {}) };
      this.state = { ...this.defaultState, ...(result[this.storageKeys.state] || {}) };
      
      // Gerar novo sessionId se não existir
      if (!this.state.sessionId) {
        this.state.sessionId = this.generateSessionId();
        await this.saveState();
      }
      
      this.notifyListeners();
      return { config: this.config, state: this.state };
    } catch (error) {
      this.logToSystem(`Erro ao carregar dados: ${error.message}`, 'ERROR', 'STATE-MANAGER');
      throw error;
    }
  }

  async load() {
    if (!this.config) {
      await this.loadAll();
    }
    return this.config;
  }

  getConfig() {
    return this.config ? { ...this.config } : { ...this.defaultConfig };
  }

  getState() {
    return this.state ? { ...this.state } : { ...this.defaultState };
  }

  getSessionId() {
    return this.state?.sessionId || 'unknown';
  }

  async saveConfig(cfg) {
    try {
      const oldConfig = { ...this.config };
      this.config = { ...this.config, ...cfg };
      
      await chrome.storage.sync.set({ [this.storageKeys.config]: this.config });
      
      this.logToSystem(`Configuração atualizada: ${this.getChanges(oldConfig, this.config)}`, 'SUCCESS', 'STATE-MANAGER');
      this.notifyListeners('config', this.config);
      
      return true;
    } catch (error) {
      this.logToSystem(`Erro ao salvar configuração: ${error.message}`, 'ERROR', 'STATE-MANAGER');
      throw error;
    }
  }

  async saveState(stateUpdate = {}) {
    try {
      const oldState = { ...this.state };
      this.state = { 
        ...this.state, 
        ...stateUpdate, 
        lastUpdate: Date.now() 
      };
      
      await chrome.storage.sync.set({ [this.storageKeys.state]: this.state });
      
      if (Object.keys(stateUpdate).length > 0) {
        this.logToSystem(`Estado atualizado: ${this.getChanges(oldState, this.state)}`, 'INFO', 'STATE-MANAGER');
      }
      
      this.notifyListeners('state', this.state);
      return true;
    } catch (error) {
      this.logToSystem(`Erro ao salvar estado: ${error.message}`, 'ERROR', 'STATE-MANAGER');
      throw error;
    }
  }

  async updateStats(type) {
    const updates = {};
    
    switch (type) {
      case 'success':
        updates.successes = (this.state.successes || 0) + 1;
        break;
      case 'error':
        updates.errors = (this.state.errors || 0) + 1;
        break;
    }
    
    updates.totalOperations = (this.state.totalOperations || 0) + 1;
    
    await this.saveState(updates);
  }

  async resetStats() {
    await this.saveState({
      errors: 0,
      successes: 0,
      totalOperations: 0
    });
    this.logToSystem('Estatísticas resetadas', 'INFO', 'STATE-MANAGER');
  }

  async clearAll() {
    try {
      await chrome.storage.sync.remove([
        this.storageKeys.config,
        this.storageKeys.state,
        this.storageKeys.session
      ]);
      
      this.config = { ...this.defaultConfig };
      this.state = { ...this.defaultState, sessionId: this.generateSessionId() };
      
      this.notifyListeners();
      this.logToSystem('Todos os dados foram limpos', 'INFO', 'STATE-MANAGER');
      
      return true;
    } catch (error) {
      this.logToSystem(`Erro ao limpar dados: ${error.message}`, 'ERROR', 'STATE-MANAGER');
      throw error;
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(type = 'all', data = null) {
    this.listeners.forEach(listener => {
      try {
        listener(type, data || { config: this.config, state: this.state });
      } catch (error) {
        this.logToSystem(`Erro ao notificar listener: ${error.message}`, 'ERROR', 'STATE-MANAGER');
      }
    });
  }

  getChanges(oldObj, newObj) {
    const changes = [];
    Object.keys(newObj).forEach(key => {
      if (oldObj[key] !== newObj[key]) {
        changes.push(`${key}: ${oldObj[key]} → ${newObj[key]}`);
      }
    });
    return changes.length > 0 ? changes.join(', ') : 'Nenhuma alteração';
  }

  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  logToSystem(message, level = 'INFO', source = 'STATE-MANAGER') {
    if (window.LogSystem) {
      window.LogSystem.addLog(message, level, source);
    } else if (window.logToSystem) {
      window.logToSystem(message, level, source);
    }
  }

  // Métodos de conveniência
  isAutomationEnabled() {
    return this.config?.automation || false;
  }

  isDebugMode() {
    return this.config?.debugMode || false;
  }

  getTradeValue() {
    return this.config?.value || 10;
  }

  getMinPayout() {
    return this.config?.minPayout || 80;
  }

  getCurrentAsset() {
    return this.state?.currentAsset || null;
  }

  isSystemActive() {
    return this.state?.isActive || false;
  }

  async setSystemActive(active) {
    await this.saveState({ isActive: active });
  }

  async setCurrentAsset(asset) {
    await this.saveState({ currentAsset: asset });
  }

  getFullDiagnostics() {
    return {
      config: this.getConfig(),
      state: this.getState(),
      session: this.getSessionId(),
      timestamp: Date.now(),
      version: chrome.runtime?.getManifest?.()?.version || 'unknown'
    };
  }
})();
