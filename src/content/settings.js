// Settings Module - Trade Manager Core
// Página de configurações otimizada baseada no sistema legado

(async function() {
  'use strict';

  // ================== ELEMENTOS DA UI ==================
  const elements = {
    // Botões de ação
    closeBtn: document.getElementById('close-settings'),
    saveBtn: document.getElementById('save-settings'),
    
    // Informações do sistema
    versionEl: document.getElementById('settings-version'),
    lastUpdateEl: document.getElementById('last-update'),
    statusEl: document.getElementById('config-status'),
    
    // Configurações de Trading - Controle de Risco
    toggleGale: document.getElementById('toggle-gale'),
    galeProfit: document.getElementById('gale-profit'),
    dailyProfit: document.getElementById('daily-profit'),
    stopLoss: document.getElementById('stop-loss'),
    
    // Configurações de Trading - Parâmetros de Operação
    toggleAutomation: document.getElementById('toggle-automation'),
    tradeValue: document.getElementById('trade-value'),
    tradeTime: document.getElementById('trade-time'),
    
    // Configurações de Payout
    minPayout: document.getElementById('min-payout'),
    payoutBehavior: document.getElementById('payout-behavior'),
    payoutTimeout: document.getElementById('payout-timeout'),
    payoutTimeoutContainer: document.getElementById('payout-timeout-container'),
    assetCategory: document.getElementById('asset-category'),
    assetSwitchingContainer: document.getElementById('asset-switching-container'),
    
    // Configurações Avançadas
    toggleTestMode: document.getElementById('toggle-test-mode'),
    toggleDevMode: document.getElementById('toggle-dev-mode')
  };

  // ================== INICIALIZAÇÃO ==================
  
  // Log de inicialização
  if (window.logToSystem) {
    window.logToSystem('Página de configurações inicializada', 'INFO', 'SETTINGS');
  }

  // Verificar elementos críticos
  const missingElements = Object.entries(elements)
    .filter(([key, element]) => !element)
    .map(([key]) => key);

  if (missingElements.length > 0) {
    if (window.logToSystem) {
      window.logToSystem(`Elementos não encontrados: ${missingElements.join(', ')}`, 'WARN', 'SETTINGS');
    }
  }

  // ================== FUNÇÕES DE SISTEMA ==================

  // Carregar informações do sistema
  async function loadSystemInfo() {
    try {
      // Versão do manifest
      const manifest = chrome.runtime.getManifest();
      if (elements.versionEl && manifest?.version) {
        elements.versionEl.textContent = `v${manifest.version}`;
        if (window.logToSystem) {
          window.logToSystem(`Versão carregada: ${manifest.version}`, 'INFO', 'SETTINGS');
        }
      } else {
        if (elements.versionEl) elements.versionEl.textContent = 'Indisponível';
        if (window.logToSystem) {
          window.logToSystem('Erro ao carregar versão do manifest', 'WARN', 'SETTINGS');
        }
      }

      // Última atualização das configurações
      const lastUpdate = await chrome.storage.sync.get(['lastConfigUpdate']);
      if (elements.lastUpdateEl) {
        if (lastUpdate.lastConfigUpdate) {
          const date = new Date(lastUpdate.lastConfigUpdate);
          elements.lastUpdateEl.textContent = date.toLocaleString('pt-BR');
        } else {
          elements.lastUpdateEl.textContent = 'Nunca';
        }
      }
    } catch (error) {
      if (window.logToSystem) {
        window.logToSystem(`Erro ao carregar informações do sistema: ${error.message}`, 'ERROR', 'SETTINGS');
      }
      if (elements.versionEl) elements.versionEl.textContent = 'Erro';
      if (elements.lastUpdateEl) elements.lastUpdateEl.textContent = 'Erro';
    }
  }

  // Atualizar status baseado nas configurações
  function updateConfigStatus() {
    const value = parseFloat(elements.tradeValue?.value || 0);
    const period = parseInt(elements.tradeTime?.value || 0);
    const payout = parseInt(elements.minPayout?.value || 0);

    let status = 'Não Configurado';
    let statusClass = 'status-error';

    if (value > 0 && period > 0 && payout >= 50) {
      status = 'Configurado';
      statusClass = 'status-success';
    } else if (value > 0 || period > 0 || payout >= 50) {
      status = 'Configuração Parcial';
      statusClass = 'status-warning';
    }

    if (elements.statusEl) {
      elements.statusEl.textContent = status;
      elements.statusEl.className = `status-badge ${statusClass}`;
    }
  }

  // Atualizar visibilidade dos campos condicionais baseado no comportamento de payout
  function updatePayoutBehaviorVisibility() {
    if (!elements.payoutBehavior || !elements.payoutTimeoutContainer || !elements.assetSwitchingContainer) {
      return;
    }

    const behavior = elements.payoutBehavior.value;

    // Resetar visibilidade
    elements.payoutTimeoutContainer.style.display = 'none';
    elements.assetSwitchingContainer.style.display = 'none';

    // Mostrar campos baseado no comportamento
    switch (behavior) {
      case 'wait':
        elements.payoutTimeoutContainer.style.display = 'flex';
        break;
      case 'switch':
        elements.assetSwitchingContainer.style.display = 'flex';
        break;
      case 'cancel':
      default:
        // Todos os campos condicionais mantidos ocultos
        break;
    }
  }

  // Controlar disponibilidade do select de gale
  function updateGaleSelectState() {
    if (elements.toggleGale && elements.galeProfit) {
      elements.galeProfit.disabled = !elements.toggleGale.checked;
    }
  }

  // ================== FUNÇÕES DE CONFIGURAÇÃO ==================

  // Carregar configurações da UI
  function getSettingsFromUI() {
    return {
      // Controle de Risco
      gale: {
        active: elements.toggleGale?.checked || false,
        profit: parseInt(elements.galeProfit?.value || 20)
      },
      dailyProfit: parseFloat(elements.dailyProfit?.value || 0),
      stopLoss: parseFloat(elements.stopLoss?.value || 0),

      // Parâmetros de Operação
      automation: elements.toggleAutomation?.checked || false,
      value: parseFloat(elements.tradeValue?.value || 0),
      period: parseInt(elements.tradeTime?.value || 0),

      // Configurações de Payout
      minPayout: parseInt(elements.minPayout?.value || 80),
      payoutBehavior: elements.payoutBehavior?.value || 'wait',
      payoutTimeout: parseInt(elements.payoutTimeout?.value || 5),
      
      // Troca de Ativos
      assetSwitching: {
        enabled: elements.payoutBehavior?.value === 'switch',
        preferredCategory: elements.assetCategory?.value || 'crypto'
      },
      
      // Configurações Avançadas
      testMode: elements.toggleTestMode?.checked || false,
      devMode: elements.toggleDevMode?.checked || false
    };
  }

  // Aplicar configurações na UI
  function applySettingsToUI(config) {
    if (!config) return;

    try {
      // Controle de Risco
      if (elements.toggleGale) elements.toggleGale.checked = config.gale?.active ?? true;
      if (elements.galeProfit) elements.galeProfit.value = config.gale?.profit || 20;
      if (elements.dailyProfit) elements.dailyProfit.value = config.dailyProfit || '';
      if (elements.stopLoss) elements.stopLoss.value = config.stopLoss || '';

      // Parâmetros de Operação
      if (elements.toggleAutomation) elements.toggleAutomation.checked = config.automation || false;
      if (elements.tradeValue) elements.tradeValue.value = config.value || '';
      if (elements.tradeTime) elements.tradeTime.value = config.period || '';

      // Configurações de Payout
      if (elements.minPayout) elements.minPayout.value = config.minPayout || 80;
      if (elements.payoutBehavior) elements.payoutBehavior.value = config.payoutBehavior || 'wait';
      if (elements.payoutTimeout) elements.payoutTimeout.value = config.payoutTimeout || 5;

      // Troca de Ativos
      if (elements.assetCategory && config.assetSwitching) {
        elements.assetCategory.value = config.assetSwitching.preferredCategory || 'crypto';
      }
      
      // Configurações Avançadas
      if (elements.toggleTestMode) elements.toggleTestMode.checked = config.testMode || false;
      if (elements.toggleDevMode) elements.toggleDevMode.checked = config.devMode || false;

      // Atualizar estados dependentes
      updateGaleSelectState();
      updatePayoutBehaviorVisibility();
      updateConfigStatus();

      if (window.logToSystem) {
        window.logToSystem('Configurações aplicadas na UI', 'SUCCESS', 'SETTINGS');
      }
    } catch (error) {
      if (window.logToSystem) {
        window.logToSystem(`Erro ao aplicar configurações na UI: ${error.message}`, 'ERROR', 'SETTINGS');
      }
    }
  }

  // ================== HANDLERS ==================

  // Salvar configurações
  async function saveSettings() {
    if (!elements.saveBtn) return;

    try {
      // Atualizar UI do botão
      const originalHTML = elements.saveBtn.innerHTML;
      elements.saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Salvando...</span>';
      elements.saveBtn.disabled = true;

      if (window.logToSystem) {
        window.logToSystem('Usuário iniciou salvamento de configurações', 'INFO', 'SETTINGS');
      }

      // Coletar configurações da UI
      const config = getSettingsFromUI();

      // Salvar via StateManager
      if (window.StateManager && typeof window.StateManager.saveConfig === 'function') {
        const success = await window.StateManager.saveConfig(config);
        if (!success) {
          throw new Error('StateManager.saveConfig retornou false');
        }

        // Atualizar timestamp de última atualização
        await chrome.storage.sync.set({ lastConfigUpdate: Date.now() });

        if (window.logToSystem) {
          window.logToSystem('Configurações salvas com sucesso via StateManager', 'SUCCESS', 'SETTINGS');
        }
      } else {
        // Fallback para chrome.storage
        await new Promise((resolve, reject) => {
          chrome.storage.sync.set({ 
            userConfig: config,
            lastConfigUpdate: Date.now()
          }, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });

        if (window.logToSystem) {
          window.logToSystem('Configurações salvas via chrome.storage (fallback)', 'SUCCESS', 'SETTINGS');
        }
      }

      // Notificar outras partes do sistema
      try {
        chrome.runtime.sendMessage({
          action: 'configUpdated',
          config: config
        });
      } catch (error) {
        // Erro silencioso na notificação
      }

      // Atualizar UI de sucesso
      elements.saveBtn.innerHTML = '<i class="fas fa-check"></i><span>Salvo!</span>';
      elements.saveBtn.style.backgroundColor = '#4CAF50';

      // Atualizar informações do sistema
      await loadSystemInfo();

      // Fechar página após 1 segundo
      setTimeout(() => {
        closeSettings();
      }, 1000);

    } catch (error) {
      if (window.logToSystem) {
        window.logToSystem(`Erro ao salvar configurações: ${error.message}`, 'ERROR', 'SETTINGS');
      }

      // Restaurar botão em caso de erro
      elements.saveBtn.innerHTML = '<i class="fas fa-times"></i><span>Erro!</span>';
      elements.saveBtn.style.backgroundColor = '#dc3545';

      setTimeout(() => {
        elements.saveBtn.innerHTML = '<i class="fas fa-save"></i><span>Salvar Configurações</span>';
        elements.saveBtn.style.backgroundColor = '';
        elements.saveBtn.disabled = false;
      }, 2000);
    }
  }

  // Fechar página
  function closeSettings() {
    try {
      // Método 1: Tentar acessar navigationManager diretamente
      if (window.parent && window.parent.navigationManager) {
        window.parent.navigationManager.closePage();
        return;
      }

      // Método 2: Usar postMessage
      window.parent.postMessage({ action: 'closePage' }, '*');
    } catch (error) {
      if (window.logToSystem) {
        window.logToSystem(`Erro ao fechar página: ${error.message}`, 'ERROR', 'SETTINGS');
      }
    }
  }

  // ================== EVENT LISTENERS ==================

  // DOMContentLoaded
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      // Carregar informações do sistema
      await loadSystemInfo();

      // Aguardar StateManager se disponível
      let config = {};
      if (window.StateManager && typeof window.StateManager.getConfig === 'function') {
        config = window.StateManager.getConfig() || {};
        if (window.logToSystem) {
          window.logToSystem(`Configurações carregadas via StateManager: ${JSON.stringify(config)}`, 'INFO', 'SETTINGS');
        }
      } else {
        // Fallback para chrome.storage
        const result = await new Promise((resolve) => {
          chrome.storage.sync.get(['userConfig'], (data) => {
            resolve(data.userConfig || {});
          });
        });
        config = result;
        if (window.logToSystem) {
          window.logToSystem(`Configurações carregadas via chrome.storage: ${JSON.stringify(config)}`, 'INFO', 'SETTINGS');
        }
      }

      // Aplicar configurações na UI
      applySettingsToUI(config);

    } catch (error) {
      if (window.logToSystem) {
        window.logToSystem(`Erro crítico na inicialização: ${error.message}`, 'ERROR', 'SETTINGS');
      }
      // Carregar configurações padrão em caso de erro
      applySettingsToUI({});
    }
  });

  // Toggle Gale
  if (elements.toggleGale) {
    elements.toggleGale.addEventListener('change', updateGaleSelectState);
  }

  // Comportamento de Payout
  if (elements.payoutBehavior) {
    elements.payoutBehavior.addEventListener('change', updatePayoutBehaviorVisibility);
  }

  // Atualização dinâmica do status
  const statusUpdateElements = [
    elements.tradeValue,
    elements.tradeTime,
    elements.minPayout
  ].filter(Boolean);

  statusUpdateElements.forEach(element => {
    element.addEventListener('input', updateConfigStatus);
    element.addEventListener('change', updateConfigStatus);
  });

  // Botão Salvar
  if (elements.saveBtn) {
    elements.saveBtn.addEventListener('click', saveSettings);
  }

  // Botão Fechar
  if (elements.closeBtn) {
    elements.closeBtn.addEventListener('click', closeSettings);
  }

  // ================== INICIALIZAÇÃO FINAL ==================

  // Configurar estados iniciais
  setTimeout(() => {
    updateGaleSelectState();
    updatePayoutBehaviorVisibility();
    updateConfigStatus();
  }, 100);

})();