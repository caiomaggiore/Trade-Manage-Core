// Lógica da página de Configurações
(async function(){
  try {
    // Elementos do formulário
    const valueEl = document.getElementById('trade-value');
    const timeEl = document.getElementById('trade-time');
    const payoutEl = document.getElementById('min-payout');
    const saveBtn = document.getElementById('save-settings');
    const closeBtn = document.getElementById('close-settings');

    // Elementos de informações
    const versionEl = document.getElementById('settings-version');
    const lastUpdateEl = document.getElementById('last-update');
    const statusEl = document.getElementById('config-status');

    // Função para atualizar status baseado nas configurações
    function updateConfigStatus() {
      const value = parseFloat(valueEl?.value || 0);
      const period = parseInt(timeEl?.value || 0);
      const payout = parseInt(payoutEl?.value || 0);

      let status = 'Não Configurado';
      let statusClass = 'status-error';

      if (value > 0 && period > 0 && payout >= 50) {
        status = 'Configurado';
        statusClass = 'status-success';
      } else if (value > 0 || period > 0 || payout >= 50) {
        status = 'Configuração Parcial';
        statusClass = 'status-warning';
      }

      if (statusEl) {
        statusEl.textContent = status;
        statusEl.className = statusClass;
      }
    }

    // Função para carregar informações do sistema
    async function loadSystemInfo() {
      // Versão do manifest
      try {
        const manifest = chrome.runtime.getManifest();
        if (versionEl && manifest?.version) {
          versionEl.textContent = manifest.version;
        }
      } catch (e) {
        if (versionEl) versionEl.textContent = 'Indisponível';
      }

      // Última atualização das configurações
      try {
        const lastUpdate = await chrome.storage.sync.get(['lastConfigUpdate']);
        if (lastUpdateEl) {
          if (lastUpdate.lastConfigUpdate) {
            const date = new Date(lastUpdate.lastConfigUpdate);
            lastUpdateEl.textContent = date.toLocaleString('pt-BR');
          } else {
            lastUpdateEl.textContent = 'Nunca';
          }
        }
      } catch (e) {
        if (lastUpdateEl) lastUpdateEl.textContent = 'Erro ao carregar';
      }
    }

    // Carregar configurações existentes
    const cfg = await window.StateManager.load();
    if (valueEl) valueEl.value = cfg.value || 10;
    if (timeEl) timeEl.value = cfg.period || 0;
    if (payoutEl) payoutEl.value = cfg.minPayout || 80;

    // Carregar informações do sistema
    await loadSystemInfo();
    
    // Atualizar status inicial
    updateConfigStatus();

    // Listeners para atualização dinâmica do status
    [valueEl, timeEl, payoutEl].forEach(el => {
      if (el) {
        el.addEventListener('input', updateConfigStatus);
        el.addEventListener('change', updateConfigStatus);
      }
    });

    // Salvar configurações
    if (saveBtn) {
      saveBtn.onclick = async () => {
        try {
          const newConfig = {
            value: parseFloat(valueEl.value) || 10,
            period: parseInt(timeEl.value) || 0,
            minPayout: parseInt(payoutEl.value) || 80
          };

          await window.StateManager.saveConfig(newConfig);
          
          // Salvar timestamp da última atualização
          await chrome.storage.sync.set({
            lastConfigUpdate: Date.now()
          });

          // Atualizar informações na tela
          await loadSystemInfo();
          updateConfigStatus();

          // Feedback para o usuário
          window.sendStatus('Configurações salvas com sucesso!', 'success', 3000);
          
          // Log da ação
          const timestamp = new Date().toLocaleString('pt-BR');
          logToSystem(`Configurações atualizadas: ${JSON.stringify(newConfig)} em ${timestamp}`, 'SUCCESS', 'SETTINGS');

        } catch (e) {
          window.sendStatus(`Erro ao salvar: ${e.message}`, 'error', 5000);
          logToSystem(`Erro ao salvar configurações: ${e.message}`, 'ERROR', 'SETTINGS');
        }
      };
    }

    // Fechar página
    if (closeBtn) {
      closeBtn.onclick = () => {
        logToSystem('Página de configurações fechada', 'INFO', 'SETTINGS');
        window.parent?.postMessage({ type: 'NAV_CLOSE_SUBPAGE' }, '*');
      };
    }

    // Log de inicialização
    logToSystem('Página de configurações carregada', 'INFO', 'SETTINGS');

  } catch (e) {
    console.error('Erro em settings.js:', e);
    logToSystem(`Erro ao carregar settings: ${e.message}`, 'ERROR', 'SETTINGS');
  }
})();


