// Lógica da página de Logs - Central de Debug do Sistema
(function(){
  let logs = [];
  let currentFilter = 'ALL';

  // Elementos da UI
  const closeBtn = document.getElementById('close-logs');
  const container = document.getElementById('log-container');
  const filterSelect = document.getElementById('log-level-filter');
  const clearBtn = document.getElementById('clear-logs');
  const exportBtn = document.getElementById('export-logs');
  
  // Elementos de estatísticas
  const totalLogsEl = document.getElementById('total-logs');
  const errorCountEl = document.getElementById('error-count');
  const successCountEl = document.getElementById('success-count');

  // Mapeamento de ícones por tipo de log
  const logIcons = {
    'DEBUG': 'fas fa-bug',
    'INFO': 'fas fa-info-circle',
    'SUCCESS': 'fas fa-check-circle',
    'WARNING': 'fas fa-exclamation-triangle',
    'ERROR': 'fas fa-exclamation-circle'
  };

  // Função para formatar timestamp
  function formatTimestamp(timestamp = Date.now()) {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Função para criar entrada de log com header e quebra de linha
  function createLogEntry(level, source, message, timestamp = Date.now()) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    const icon = logIcons[level] || logIcons['INFO'];
    
    // Estrutura: header (ícone + timestamp + badges) + mensagem em linha separada
    entry.innerHTML = `
      <div class="log-header">
        <div class="log-icon ${level}">
          <i class="${icon}"></i>
        </div>
        <div class="log-timestamp">${formatTimestamp(timestamp)}</div>
        <div class="log-type ${level}">${level}</div>
        <div class="log-source">${source}</div>
      </div>
      <div class="log-message">${message}</div>
    `;
    
    return entry;
  }

  // Função para adicionar log ao sistema
  function addLog(level, source, message, timestamp = Date.now()) {
    if (!container) return;
    
    const logData = { level, source, message, timestamp };
    logs.push(logData);
    
    // Se for o primeiro log, limpar o placeholder
    if (logs.length === 1) {
      container.innerHTML = '';
    }
    
    // Adicionar visualmente se passar pelo filtro
    if (currentFilter === 'ALL' || currentFilter === level) {
      const entry = createLogEntry(level, source, message, timestamp);
      container.appendChild(entry);
      container.scrollTop = container.scrollHeight;
    }
    
    updateStatistics();
  }

  // Função para atualizar estatísticas
  function updateStatistics() {
    const total = logs.length;
    const errors = logs.filter(log => log.level === 'ERROR').length;
    const successes = logs.filter(log => log.level === 'SUCCESS').length;
    
    if (totalLogsEl) totalLogsEl.textContent = total;
    if (errorCountEl) errorCountEl.textContent = errors;
    if (successCountEl) successCountEl.textContent = successes;
  }

  // Função para filtrar logs
  function filterLogs() {
    if (!container) return;
    
    // Limpar container
    container.innerHTML = '';
    
    if (logs.length === 0) {
      container.innerHTML = `
        <div style="color: #64748b; text-align: center; padding: 20px; font-style: italic;">
          Nenhum log capturado ainda
        </div>
      `;
      return;
    }
    
    // Filtrar e exibir logs
    const filteredLogs = currentFilter === 'ALL' 
      ? logs 
      : logs.filter(log => log.level === currentFilter);
    
    if (filteredLogs.length === 0) {
      container.innerHTML = `
        <div style="color: #64748b; text-align: center; padding: 20px; font-style: italic;">
          Nenhum log encontrado para o filtro "${currentFilter}"
        </div>
      `;
      return;
    }
    
    filteredLogs.forEach(log => {
      const entry = createLogEntry(log.level, log.source, log.message, log.timestamp);
      container.appendChild(entry);
    });
    
    container.scrollTop = container.scrollHeight;
  }

  // Função para limpar logs
  function clearLogs() {
    logs = [];
    if (container) {
      container.innerHTML = `
        <div style="color: #64748b; text-align: center; padding: 20px; font-style: italic;">
          Logs limpos - aguardando novos registros
        </div>
      `;
    }
    updateStatistics();
    
    // Log da ação
    setTimeout(() => {
      addLog('INFO', 'LOGS', 'Sistema de logs limpo pelo usuário');
    }, 100);
  }

  // Função para exportar logs
  function exportLogs() {
    if (logs.length === 0) {
      alert('Nenhum log para exportar');
      return;
    }
    
    const exportData = logs.map(log => 
      `${formatTimestamp(log.timestamp)} | ${log.level} | ${log.source} | ${log.message}`
    ).join('\n');
    
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-manager-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLog('SUCCESS', 'LOGS', `Logs exportados com sucesso (${logs.length} registros)`);
  }

  // Event Listeners
  if (closeBtn) {
    closeBtn.onclick = () => {
      addLog('INFO', 'LOGS', 'Página de logs fechada');
      window.parent?.postMessage({ type: 'NAV_CLOSE_SUBPAGE' }, '*');
    };
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      currentFilter = e.target.value;
      filterLogs();
      addLog('INFO', 'LOGS', `Filtro alterado para: ${currentFilter}`);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja limpar todos os logs?')) {
        clearLogs();
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', exportLogs);
  }

  // Listener para logs vindos do sistema
  window.addEventListener('message', (e) => {
    if (e?.data?.type === 'LOG_MESSAGE') {
      const { message = '', level = 'INFO', source = 'CORE' } = e.data.data || {};
      addLog(level, source, message);
    }
  });

  // Inicialização
  updateStatistics();
  
  // Limpar placeholder inicial e configurar estado vazio
  if (container) {
    container.innerHTML = `
      <div style="color: #64748b; text-align: center; padding: 20px; font-style: italic;">
        Sistema de logs inicializado - aguardando registros
      </div>
    `;
  }
})();


