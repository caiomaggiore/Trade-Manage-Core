// Lógica da página de Logs - Central de Debug do Sistema (Integrado com LogSystem)
(function(){
  let currentFilter = 'ALL';
  let logSystemListener = null;

  // Elementos da UI
  const closeBtn = document.getElementById('close-logs');
  const container = document.getElementById('log-container');
  const filterSelect = document.getElementById('log-level-filter');
  const copyBtn = document.getElementById('copy-logs');
  const clearBtn = document.getElementById('clear-logs');
  const exportBtn = document.getElementById('export-logs');
  
  // Elementos de estatísticas
  const totalLogsEl = document.getElementById('total-logs');
  const errorCountEl = document.getElementById('error-count');
  const warningCountEl = document.getElementById('warning-count');
  const successCountEl = document.getElementById('success-count');
  
  // Elemento do contador de filtro
  const filterCountEl = document.getElementById('filter-count');

  // Mapeamento de ícones por tipo de log
  const logIcons = {
    'DEBUG': 'fas fa-bug',
    'INFO': 'fas fa-info-circle',
    'SUCCESS': 'fas fa-check-circle',
    'WARNING': 'fas fa-exclamation-triangle',
    'ERROR': 'fas fa-exclamation-circle'
  };

  // Função para obter timestamp (usando timestampFormatted do legado)
  function getDisplayTimestamp(logEntry) {
    // Usar timestampFormatted como no sistema legado
    return logEntry.timestampFormatted || logEntry.timestamp || 'N/A';
  }

  // Função para criar entrada de log com header e quebra de linha
  function createLogEntry(level, source, message, logData = null) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    const icon = logIcons[level] || logIcons['INFO'];
    
    // Usar o timestamp que já vem formatado
    let displayTime = 'N/A';
    if (logData && typeof logData === 'object') {
      displayTime = getDisplayTimestamp(logData);
    }
    
    // Estrutura: header (ícone + timestamp + badges) + mensagem em linha separada
    entry.innerHTML = `
      <div class="log-header">
        <div class="log-icon ${level}">
          <i class="${icon}"></i>
        </div>
        <div class="log-timestamp">${displayTime}</div>
        <div class="log-type ${level}">${level}</div>
        <div class="log-source">${source}</div>
      </div>
      <div class="log-message">${message}</div>
    `;
    
    return entry;
  }

  // Função para conectar ao LogSystem
  function connectToLogSystem() {
    if (!window.LogSystem || !window.LogSystem.initialized) {
      console.log('⏳ Aguardando LogSystem...');
      setTimeout(connectToLogSystem, 100);
      return;
    }

    console.log('🔗 Conectando ao LogSystem...');
    
    // Carregar logs existentes imediatamente
    const existingLogs = window.LogSystem.getLogs();
    console.log(`📋 Logs encontrados no sistema: ${existingLogs?.length || 0}`);
    
    if (existingLogs && existingLogs.length > 0) {
      displayLogs(existingLogs);
    } else {
      console.log('📋 Nenhum log encontrado - mostrando placeholder');
      displayLogs([]); // Força exibição do placeholder
    }

    // Registrar listener para novos logs
    logSystemListener = window.LogSystem.addListener((event) => {
      if (event && event.type === 'LOGS_RELOADED') {
        displayLogs(event.logs);
      } else {
        // Novo log individual
        addLogToUI(event);
      }
      updateStatisticsFromLogSystem();
    });

    updateStatisticsFromLogSystem();
    console.log('✅ LogSystem conectado com sucesso');
  }

  // Função para exibir logs da memória
  function displayLogs(logs) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (logs.length === 0) {
      container.innerHTML = `
        <div style="color: #64748b; text-align: center; padding: 20px; font-style: italic;">
          Sistema de logs inicializado - aguardando registros
        </div>
      `;
      return;
    }

    const filteredLogs = currentFilter === 'ALL' 
      ? logs 
      : logs.filter(log => {
          // Mapear WARN para WARNING para compatibilidade
          const normalizedCurrentFilter = currentFilter === 'WARN' ? 'WARNING' : currentFilter;
          const logLevel = log.level === 'WARN' ? 'WARNING' : log.level;
          return logLevel === normalizedCurrentFilter;
        });

    if (filteredLogs.length === 0) {
      container.innerHTML = `
        <div style="color: #64748b; text-align: center; padding: 20px; font-style: italic;">
          Nenhum log encontrado para o filtro "${currentFilter}"
        </div>
      `;
      return;
    }

    filteredLogs.forEach(log => {
      const entry = createLogEntry(log.level, log.source, log.message, log);
      container.appendChild(entry);
    });
    
    container.scrollTop = container.scrollHeight;
  }

  // Função para adicionar log individual à UI
  function addLogToUI(logEntry) {
    if (!container) return;
    
    // Se há placeholder, remover
    const placeholder = container.querySelector('div[style*="text-align: center"]');
    if (placeholder) {
      container.innerHTML = '';
    }
    
    // Adicionar visualmente se passar pelo filtro
    if (currentFilter === 'ALL' || currentFilter === logEntry.level) {
      const entry = createLogEntry(logEntry.level, logEntry.source, logEntry.message, logEntry);
      container.appendChild(entry);
      container.scrollTop = container.scrollHeight;
    }
    
    updateStatisticsFromLogSystem();
  }

  // Função para atualizar estatísticas do LogSystem
  function updateStatisticsFromLogSystem() {
    if (!window.LogSystem) return;
    
    const stats = window.LogSystem.getStats();
    
    if (totalLogsEl) totalLogsEl.textContent = stats.total;
    if (errorCountEl) errorCountEl.textContent = stats.byLevel.ERROR || 0;
    if (warningCountEl) warningCountEl.textContent = stats.byLevel.WARNING || stats.byLevel.WARN || 0;
    if (successCountEl) successCountEl.textContent = stats.byLevel.SUCCESS || 0;
    
    // Atualizar contador do filtro
    updateFilterCount();
  }

  // Função para atualizar contador do filtro
  function updateFilterCount() {
    if (!filterSelect || !filterCountEl || !window.LogSystem) return;
    
    const selectedLevel = filterSelect.value;
    const allLogs = window.LogSystem.getLogs();
    
    let filteredCount = 0;
    
    if (selectedLevel === 'ALL') {
      filteredCount = allLogs.length;
    } else {
      // Mapear WARN para WARNING para compatibilidade
      const normalizedLevel = selectedLevel === 'WARN' ? 'WARNING' : selectedLevel;
      filteredCount = allLogs.filter(log => {
        const logLevel = log.level === 'WARN' ? 'WARNING' : log.level;
        return logLevel === normalizedLevel;
      }).length;
    }
    
    filterCountEl.textContent = `${filteredCount} logs`;
  }

  // Função para filtrar logs
  function filterLogs() {
    if (!window.LogSystem) return;
    
    const allLogs = window.LogSystem.getLogs();
    displayLogs(allLogs);
    updateFilterCount();
  }

  // Função para limpar logs - ação crítica do usuário
  async function clearLogs() {
    if (!window.LogSystem) {
      window.logToSystem?.('Tentativa de limpeza falhou - LogSystem não disponível', 'ERROR', 'LOGS-VIEWER');
      return;
    }
    
    window.logToSystem?.('Usuário solicitou limpeza de todos os logs', 'WARN', 'LOGS-VIEWER');
    
    const count = await window.LogSystem.clearLogs();
    updateStatisticsFromLogSystem();
    
    window.logToSystem?.(`${count} logs removidos pelo usuário`, 'INFO', 'LOGS-VIEWER');
  }

  // Função para copiar logs para área de transferência
  async function copyLogs() {
    if (!window.LogSystem) {
      window.logToSystem?.('Tentativa de cópia falhou - LogSystem não disponível', 'ERROR', 'LOGS-VIEWER');
      return;
    }

    const allLogs = window.LogSystem.getLogs();
    if (allLogs.length === 0) {
      window.logToSystem?.('Tentativa de cópia cancelada - nenhum log disponível', 'WARN', 'LOGS-VIEWER');
      return;
    }

    try {
      window.logToSystem?.('Usuário solicitou cópia de logs para área de transferência', 'INFO', 'LOGS-VIEWER');
      
      // Formatação idêntica ao que o usuário está vendo nos logs
      let content = '';
      allLogs.forEach(log => {
        const timestamp = log.timestampFormatted || new Date().toLocaleString('pt-BR');
        content += `[${timestamp}]\n${log.level}\n${log.source}\n${log.message}\n`;
      });

      // Usar método funcional: document.execCommand
      let success = false;
      let method = 'execCommand';

      try {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (success) {
          window.logToSystem?.('Cópia bem-sucedida via execCommand', 'DEBUG', 'LOGS-VIEWER');
        } else {
          throw new Error('execCommand retornou false');
        }
      } catch (execError) {
        window.logToSystem?.(`Erro na cópia: ${execError.message}`, 'ERROR', 'LOGS-VIEWER');
        throw new Error(`Falha ao copiar: ${execError.message}`);
      }

      if (success) {
        // Feedback visual no botão
        if (copyBtn) {
          const originalHTML = copyBtn.innerHTML;
          copyBtn.innerHTML = '<i class="fas fa-check"></i><span>Copiado!</span>';
          copyBtn.style.backgroundColor = '#4CAF50';
          
          setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.backgroundColor = '';
          }, 2000);
        }

        window.logToSystem?.(`Logs copiados com sucesso via ${method.toUpperCase()} (${allLogs.length} registros)`, 'SUCCESS', 'LOGS-VIEWER');
      }

    } catch (error) {
      window.logToSystem?.(`Erro ao copiar logs: ${error.message}`, 'ERROR', 'LOGS-VIEWER');
      
      // Feedback de erro no botão
      if (copyBtn) {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-times"></i><span>Erro!</span>';
        copyBtn.style.backgroundColor = '#f44336';
        
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
          copyBtn.style.backgroundColor = '';
        }, 2000);
      }

      // Oferecer download como alternativa
      setTimeout(() => {
        window.logToSystem?.('Tente usar o botão "Exportar" como alternativa', 'INFO', 'LOGS-VIEWER');
      }, 2000);
    }
  }

  // Função para exportar logs - ação do usuário
  function exportLogs() {
    if (!window.LogSystem) {
      window.logToSystem?.('Tentativa de exportação falhou - LogSystem não disponível', 'ERROR', 'LOGS-VIEWER');
      alert('Sistema de logs não disponível');
      return;
    }
    
    const allLogs = window.LogSystem.getLogs();
    if (allLogs.length === 0) {
      window.logToSystem?.('Tentativa de exportação cancelada - nenhum log disponível', 'WARN', 'LOGS-VIEWER');
      alert('Nenhum log para exportar');
      return;
    }
    
    try {
      window.logToSystem?.('Usuário solicitou exportação de logs', 'INFO', 'LOGS-VIEWER');
      
      const { content, filename } = window.LogSystem.exportLogs('txt');
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      window.logToSystem?.(`Logs exportados com sucesso: ${filename} (${allLogs.length} registros)`, 'SUCCESS', 'LOGS-VIEWER');
    } catch (error) {
      window.logToSystem?.(`Erro na exportação de logs: ${error.message}`, 'ERROR', 'LOGS-VIEWER');
    }
  }

  // Event Listeners
  if (closeBtn) {
    closeBtn.onclick = () => {
      if (window.LogSystem) {
        window.LogSystem.addLog('Página de logs fechada', 'INFO', 'LOGS');
      }
      // Remover listener ao fechar
      if (logSystemListener) {
        logSystemListener();
      }
      window.parent?.postMessage({ type: 'NAV_CLOSE_SUBPAGE' }, '*');
    };
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      currentFilter = e.target.value;
      filterLogs();
      updateFilterCount();
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', copyLogs);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (confirm('Tem certeza que deseja limpar todos os logs?')) {
        await clearLogs();
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', exportLogs);
  }

  // Inicialização
  connectToLogSystem();
  
  // Log de inicialização
  setTimeout(() => {
    if (window.LogSystem) {
      window.LogSystem.addLog('Página de logs carregada e conectada ao LogSystem', 'INFO', 'LOGS');
    }
  }, 100);
})();


