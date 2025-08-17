// Sistema Robusto de Logs Centralizados - Trade Manager Core
(function() {
  'use strict';

  class LogSystem {
    constructor() {
      this.logs = [];
      this.maxLogs = 500; // Limite do legado - balanceio performance/permanência
      this.logQueue = [];
      this.isProcessing = false;
      this.listeners = new Set();
      this.storageKey = 'systemLogs'; // Usar mesma chave do legado
      this.persistentLogs = true;
      this.initialized = false;
      this.lastLogKey = ''; // Para evitar duplicação
      
      this.init();
    }

    async init() {
      // Evitar inicializações duplicadas
      if (this.initialized) {
        return this;
      }
      
      try {
        console.log('🔄 Inicializando LogSystem...');
        
        // Carregar logs do storage PRIMEIRO
        await this.loadPersistedLogs();
        
        // Marcar como inicializado
        this.initialized = true;
        
        console.log(`📚 LogSystem inicializado com ${this.logs.length} logs carregados`);
        
        // Configurar limpeza automática
        this.setupCleanup();
        
        // Log de inicialização APENAS se não há logs ou se é a primeira vez
        if (this.logs.length === 0) {
          this.addLog('Sistema de logs robusto inicializado', 'SUCCESS', 'LOG-SYSTEM');
        }
        
      } catch (error) {
        this.initialized = true; // Marcar como inicializado mesmo com erro
        console.error('❌ Erro ao inicializar LogSystem:', error);
        this.addLog('Falha na inicialização do sistema de logs', 'ERROR', 'LOG-SYSTEM');
      }
      
      return this;
    }

    // Método para remover logs duplicados (do legado)
    removeDuplicateLogs(logs) {
      const uniqueMap = new Map();
      
      logs.filter(log => log.message).forEach(log => {
        // Criar chave baseada em message + source + level (ignorando timestamp)
        const key = `${log.message || ''}-${log.source || ''}-${log.level || ''}`;
        
        // Manter apenas o mais recente se já existe
        if (!uniqueMap.has(key) || 
            (uniqueMap.get(key).timestampFormatted < (log.timestampFormatted || ''))) {
          uniqueMap.set(key, log);
        }
      });
      
      return Array.from(uniqueMap.values());
    }

    async loadPersistedLogs() {
      if (!this.persistentLogs) {
        console.log('📝 Persistência desabilitada - iniciando com logs vazios');
        return;
      }
      
      try {
        console.log('🔍 Buscando logs no chrome.storage.local...');
        
        // Verificar se chrome.storage está disponível
        if (!chrome?.storage?.local) {
          console.warn('⚠️ chrome.storage.local não disponível');
          return;
        }
        
        const result = await chrome.storage.local.get([this.storageKey]);
        console.log('📦 Resultado do storage:', result);
        
        const storedLogs = result[this.storageKey] || [];
        
        if (storedLogs.length === 0) {
          console.log('🆕 Nenhum log encontrado - primeira execução');
          this.logs = [];
          return;
        }
        
        // Verificar se foi apenas limpo (só tem log de limpeza)
        if (storedLogs.length === 1 && 
            storedLogs[0].message && 
            storedLogs[0].message.includes('Todos os logs foram limpos')) {
          this.logs = storedLogs;
          console.log('🧹 Apenas log de limpeza encontrado');
          return;
        }
        
        // Filtrar logs duplicados e inválidos
        const uniqueLogs = this.removeDuplicateLogs(storedLogs);
        
        // Converter para formato interno e validar
        this.logs = uniqueLogs.map(log => {
          const message = log.message || '';
          if (!message && typeof message !== 'string') {
            return null; // Ignorar logs inválidos
          }
          
          return {
            message: message,
            level: log.level || 'INFO',
            source: log.source || 'SYSTEM',
            timestampFormatted: log.timestampFormatted || ''
          };
        }).filter(log => log !== null);
        
        // Ordenar cronologicamente
        this.logs.sort((a, b) => a.timestampFormatted.localeCompare(b.timestampFormatted));
        
        // Aplicar limite
        if (this.logs.length > this.maxLogs) {
          this.logs = this.logs.slice(-this.maxLogs);
        }
        
        console.log(`✅ ${this.logs.length} logs únicos carregados do storage`);
        
      } catch (error) {
        console.error('❌ Falha ao carregar logs do storage:', error);
        this.logs = [];
      }
    }

    async persistLogs() {
      if (!this.persistentLogs) {
        console.log('📝 Persistência desabilitada - logs não salvos');
        return;
      }
      
      // Verificar se chrome.storage está disponível
      if (!chrome?.storage?.local) {
        console.warn('⚠️ chrome.storage.local não disponível para salvar');
        return;
      }
      
      try {
        console.log(`💾 Salvando ${this.logs.length} logs no storage...`);
        
        // Salvar TODOS os logs - eles devem ser permanentes
        await chrome.storage.local.set({ [this.storageKey]: this.logs });
        console.log(`✅ ${this.logs.length} logs persistidos com sucesso`);
        
      } catch (error) {
        console.warn('⚠️ Falha ao persistir logs:', error);
        
        // Se falhar por falta de espaço, tentar com menos logs
        if (this.logs.length > 500) {
          try {
            const reducedLogs = this.logs.slice(-500);
            await chrome.storage.local.set({ [this.storageKey]: reducedLogs });
            this.logs = reducedLogs;
            console.log(`✅ Logs reduzidos e persistidos: ${reducedLogs.length} registros`);
          } catch (secondError) {
            console.error('❌ Falha crítica na persistência:', secondError);
          }
        } else {
          console.error('❌ Falha na persistência mesmo com poucos logs:', error);
        }
      }
    }

    // Função de formatação de timestamp do legado
    formatTimestamp(date = new Date()) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `[${day}/${month}/${year}, ${hours}:${minutes}:${seconds}]`;
    }

    // Verificar se um log é duplicado (do legado)
    isDuplicateLog(message, level, source) {
      const logKey = `${message}-${level}-${source}`;
      if (this.lastLogKey === logKey) {
        return true;
      }
      this.lastLogKey = logKey;
      return false;
    }

    addLog(message, level = 'INFO', source = 'CORE') {
      if (!message) return false;
      
      const normalizedLevel = (level || 'INFO').toUpperCase();
      const normalizedSource = source || 'CORE';
      
      // Verificar duplicação
      if (this.isDuplicateLog(message, normalizedLevel, normalizedSource)) {
        return false;
      }

      // Gerar timestamp formatado FIXO no momento da criação
      const now = new Date();
      const timestampFormatted = this.formatTimestamp(now);

      const logEntry = {
        message: String(message),
        level: normalizedLevel,
        source: normalizedSource,
        timestampFormatted: timestampFormatted // Campo único e imutável como no legado
      };

      // Adicionar à fila para processamento
      this.logQueue.push(logEntry);
      this.processQueue();
      
      return true;
    }

    async processQueue() {
      if (this.isProcessing || this.logQueue.length === 0) return;
      
      this.isProcessing = true;
      
      try {
        while (this.logQueue.length > 0) {
          const logEntry = this.logQueue.shift();
          
          // Adicionar ao array principal
          this.logs.push(logEntry);
          
          // Aplicar limite de logs (do legado)
          if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
          }
          
          // Salvar log individual no storage (como no legado)
          this.saveLogToStorage(logEntry);
          
          // Notificar listeners sobre o novo log
          this.notifyListeners(logEntry);
          
          // Enviar via postMessage para compatibilidade
          window.postMessage({ 
            type: 'LOG_MESSAGE', 
            data: { 
              message: logEntry.message, 
              level: logEntry.level, 
              source: logEntry.source,
              timestampFormatted: logEntry.timestampFormatted
            } 
          }, '*');
        }
        
      } finally {
        this.isProcessing = false;
      }
    }

    // Salvar log individual no storage (do legado)
    async saveLogToStorage(logEntry) {
      if (!chrome?.storage?.local) {
        return false;
      }
      
      try {
        // Obter logs existentes
        const result = await chrome.storage.local.get([this.storageKey]);
        let storedLogs = result[this.storageKey] || [];
        
        // Adicionar novo log
        storedLogs.push(logEntry);
        
        // Limitar quantidade
        if (storedLogs.length > this.maxLogs) {
          storedLogs = storedLogs.slice(-this.maxLogs);
        }
        
        // Remover duplicados
        storedLogs = this.removeDuplicateLogs(storedLogs);
        
        // Salvar
        await chrome.storage.local.set({ [this.storageKey]: storedLogs });
        
        return true;
      } catch (error) {
        return false;
      }
    }

    notifyListeners(logEntry = null) {
      this.listeners.forEach(listener => {
        try {
          if (logEntry) {
            listener(logEntry);
          } else {
            listener({ type: 'LOGS_RELOADED', logs: this.logs });
          }
        } catch (error) {
          console.warn('Erro ao notificar listener:', error);
        }
      });
    }

    // API Pública
    getLogs(filter = {}) {
      let filteredLogs = [...this.logs];
      
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level.toUpperCase());
      }
      
      if (filter.source) {
        filteredLogs = filteredLogs.filter(log => log.source === filter.source.toUpperCase());
      }
      
      if (filter.since) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.since);
      }
      
      return filteredLogs;
    }

    getStats() {
      const stats = {
        total: this.logs.length,
        byLevel: {},
        bySource: {},
        recent: this.logs.slice(-10)
      };
      
      this.logs.forEach(log => {
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
        stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1;
      });
      
      return stats;
    }

    async clearLogs() {
      const count = this.logs.length;
      this.logs = [];
      await this.persistLogs();
      this.notifyListeners();
      this.addLog(`Logs limpos pelo usuário (${count} registros removidos)`, 'INFO', 'LOG-SYSTEM');
      return count;
    }

    exportLogs(format = 'txt') {
      const exportTimestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `trade-manager-logs-${exportTimestamp}.${format}`;
      
      let content = '';
      
      if (format === 'json') {
        content = JSON.stringify(this.logs, null, 2);
      } else {
        content = this.logs.map(log => {
          return `${log.timestampFormatted} [${log.level}] [${log.source}] ${log.message}`;
        }).join('\n');
      }
      
      return { content, filename };
    }

    addListener(callback) {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }

    setupCleanup() {
      // Logs são permanentes - sem limpeza automática
      // Apenas salvamento periódico para garantir persistência
      setInterval(async () => {
        await this.persistLogs();
      }, 5 * 60 * 1000); // A cada 5 minutos
    }

    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
  }

  // Instância global
  window.LogSystem = new LogSystem();

  // Função de debug para verificar storage
  window.debugLogStorage = async function() {
    try {
      const result = await chrome.storage.local.get(['tradeManagerLogs']);
      console.log('🔍 Debug Storage - Conteúdo completo:', result);
      console.log(`📊 Total de logs no storage: ${result.tradeManagerLogs?.length || 0}`);
      if (result.tradeManagerLogs?.length > 0) {
        console.log('📋 Últimos 3 logs:', result.tradeManagerLogs.slice(-3));
      }
      return result.tradeManagerLogs;
    } catch (error) {
      console.error('❌ Erro ao verificar storage:', error);
      return null;
    }
  };

  // Função para verificar e limpar storage se necessário
  window.clearLogStorage = async function() {
    try {
      await chrome.storage.local.remove(['tradeManagerLogs']);
      console.log('🗑️ Storage de logs limpo');
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar storage:', error);
      return false;
    }
  };

  // Função para verificar o tamanho do storage
  window.checkStorageUsage = async function() {
    try {
      const result = await chrome.storage.local.getBytesInUse();
      console.log(`📏 Uso atual do storage: ${result} bytes`);
      
      const logData = await chrome.storage.local.get(['tradeManagerLogs']);
      const logSize = JSON.stringify(logData).length;
      console.log(`📋 Tamanho dos logs: ${logSize} bytes`);
      
      return { total: result, logs: logSize };
    } catch (error) {
      console.error('❌ Erro ao verificar storage:', error);
      return null;
    }
  };

  // APIs de compatibilidade
window.sendLog = (message, level = 'INFO', source = 'CORE') => {
    window.LogSystem.addLog(message, level, source);
  };

  window.sendStatus = (message, type = 'info', duration = 3000, icon = null, loading = false) => {
    window.postMessage({ 
      type: 'UPDATE_STATUS', 
      data: { message, type, duration, icon, loading } 
    }, '*');
  };

  window.logToSystem = (message, level = 'INFO', source = 'CORE') => {
    window.LogSystem.addLog(message, level, source);
  };

})();
