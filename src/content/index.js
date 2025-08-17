// Controller dentro do iframe
(function(){
  const statusEl = () => document.getElementById('status-processo');
  const versionEl = () => document.getElementById('app-version');

  // Sistema de Status Aprimorado
  let statusTimeout;
  
  function updateFooterStatus(message, type = 'info', duration = 3000, icon = null, loading = false) {
    const footerStatus = document.querySelector('.footer-status');
    const statusText = footerStatus?.querySelector('.status-text');
    const statusIcon = footerStatus?.querySelector('.status-icon');
    
    if (!footerStatus || !statusText || !statusIcon) {
      // Apenas log crítico quando elementos essenciais da UI não são encontrados
      window.logToSystem?.('Elementos críticos do footer de status não encontrados', 'ERROR', 'INDEX');
      return;
    }
    
    // Limpa timeout anterior
    if (statusTimeout) clearTimeout(statusTimeout);
    
    // Define ícone baseado no tipo se não especificado
    const icons = {
      info: 'fas fa-info-circle',
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      loading: 'fas fa-spinner fa-spin'
    };
    
    const iconClass = icon || icons[type] || icons.info;
    
    // Atualiza classes
    footerStatus.className = `footer-status ${type} visible${loading ? ' loading' : ''}`;
    statusIcon.className = `status-icon ${iconClass}`;
    statusText.textContent = message;
    
    // Auto-reset para status padrão
    if (duration > 0) {
      statusTimeout = setTimeout(() => {
        footerStatus.className = 'footer-status info visible';
        statusIcon.className = 'status-icon fas fa-check-circle';
        statusText.textContent = 'Sistema Pronto';
      }, duration);
    }
  }

  // Recebe UPDATE_STATUS interno do iframe
  window.addEventListener('message', (event) => {
    if (event?.data?.type === 'UPDATE_STATUS') {
      const { message, type = 'info', duration = 3000, icon, loading } = event.data.data || {};
      updateFooterStatus(message, type, duration, icon, loading);
    }
  });

  // Sistema de inicialização
  function initializeSystem() {
    // Exibe versão do manifest no footer
    try {
      const vEl = versionEl();
      if (vEl) {
        const version = chrome.runtime.getManifest?.().version || '-';
        vEl.textContent = version;
        window.logToSystem?.(`Interface inicializada - versão ${version}`, 'INFO', 'INDEX');
      } else {
        window.logToSystem?.('Elemento de versão não encontrado na UI', 'WARN', 'INDEX');
      }
    } catch(error) {
      window.logToSystem?.(`Erro ao obter versão do manifest: ${error.message}`, 'ERROR', 'INDEX');
    }
    
    // Simula carregamento do sistema e mostra "Sistema Pronto" quando tudo estiver carregado
    setTimeout(() => {
      const currentTime = new Date().toLocaleString('pt-BR');
      window.logToSystem?.(`Sistema inicializado com sucesso em ${currentTime}`, 'SUCCESS', 'INDEX');
      updateFooterStatus('Sistema Pronto', 'success', 0, 'fas fa-check-circle');
    }, 1500); // 1.5s para simular carregamento
  }

  // Bind de botões básicos
  document.addEventListener('DOMContentLoaded', () => {
    // Mostra status inicial imediatamente
    const footerStatus = document.querySelector('.footer-status');
    if (footerStatus) {
      footerStatus.classList.add('visible');
    }
    
    // Inicializa o sistema
    initializeSystem();
    const btnCapture = document.getElementById('captureBtn');
    const btnAnalyze = document.getElementById('analyzeBtn');
    const btnSettings = document.getElementById('settings-btn');
    const btnLogs = document.getElementById('logs-btn');
    if (btnCapture) btnCapture.addEventListener('click', async () => {
      try {
        sendStatus('Capturando tela...', 'info', 0, 'fas fa-camera', true);
        window.logToSystem?.('Usuário iniciou captura de tela', 'INFO', 'CAPTURE');
        
        const img = await window.CaptureScreen.capture();
        sendStatus('Captura concluída com sucesso!', 'success', 3000, 'fas fa-check-circle');
        window.logToSystem?.('Captura de tela realizada com sucesso', 'SUCCESS', 'CAPTURE');
        
        const popup = window.open('', '_blank', 'width=720,height=520');
        if (popup && popup.document) {
          popup.document.title = 'Captura de Tela - Trade Manager Core';
          popup.document.body.style.margin = '0';
          popup.document.body.style.background = '#0b1020';
          popup.document.body.style.display = 'flex';
          popup.document.body.style.alignItems = 'center';
          popup.document.body.style.justifyContent = 'center';
          
          const image = popup.document.createElement('img');
          image.src = img;
          image.style.maxWidth = '100%';
          image.style.maxHeight = '100vh';
          image.style.borderRadius = '8px';
          image.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
          popup.document.body.appendChild(image);
          
          window.logToSystem?.('Popup de captura aberto com sucesso', 'INFO', 'CAPTURE');
        } else {
          window.logToSystem?.('Falha ao abrir popup - possivelmente bloqueado pelo navegador', 'WARN', 'CAPTURE');
          sendStatus('Captura realizada, mas popup foi bloqueado', 'warning', 4000, 'fas fa-exclamation-triangle');
        }
      } catch (e) { 
        sendStatus(`Erro na captura: ${e.message}`, 'error', 5000, 'fas fa-exclamation-circle');
        window.logToSystem?.(`Erro na captura de tela: ${e.message}`, 'ERROR', 'CAPTURE');
      }
    });
    if (btnAnalyze) btnAnalyze.addEventListener('click', async () => {
      sendStatus('🧠 Iniciando análise inteligente...', 'info', 0, 'fas fa-brain', true);
      window.logToSystem?.('Usuário iniciou análise inteligente', 'INFO', 'ANALYZE');
      
      // Placeholder para orquestração futura
      setTimeout(() => {
        sendStatus('Análise concluída com sucesso!', 'success', 3000, 'fas fa-check-circle');
        window.logToSystem?.('Análise inteligente simulada concluída', 'SUCCESS', 'ANALYZE');
      }, 2000);
    });

    if (btnSettings) btnSettings.addEventListener('click', () => {
      if (window.TMCNavigation?.openSettings) {
        window.TMCNavigation.openSettings();
      } else {
        window.logToSystem?.('Sistema de navegação não encontrado para abrir configurações', 'ERROR', 'NAVIGATION');
        sendStatus('Erro: sistema de navegação não disponível', 'error', 3000);
      }
    });
    
    if (btnLogs) btnLogs.addEventListener('click', () => {
      if (window.TMCNavigation?.openLogs) {
        window.TMCNavigation.openLogs();
      } else {
        window.logToSystem?.('Sistema de navegação não encontrado para abrir logs', 'ERROR', 'NAVIGATION');
        sendStatus('Erro: sistema de navegação não disponível', 'error', 3000);
      }
    });

    // Painel Dev - Apenas teste de payout
    const testPayoutBtn = document.getElementById('testPayoutBtn');
    const payoutResult = document.getElementById('payoutResult');
    const devStatus = document.getElementById('devStatus');

    function updateDevStatus(message, type = 'info') {
      if (devStatus) {
        devStatus.textContent = message;
        devStatus.className = `status-${type}`;
      }
    }

    function updatePayoutResult(message, type = 'info') {
      if (payoutResult) {
        payoutResult.textContent = message;
        payoutResult.className = `status-${type}`;
      }
    }

    if (testPayoutBtn) testPayoutBtn.addEventListener('click', async () => {
      try {
        updateDevStatus('Iniciando captura...', 'info');
        updatePayoutResult('Buscando...', 'info');
        sendStatus('Testando captura de payout...', 'info', 0, 'fas fa-percentage', true);
        logToSystem('=== INÍCIO DO TESTE DE PAYOUT ===', 'INFO', 'PAYOUT-TEST');
        
        // Chama a função específica do content.js
        const response = await chrome.runtime.sendMessage({ action: 'CAPTURE_PAYOUT_FROM_DOM' });
        
        if (response?.success) {
          const payout = response.payout;
          updatePayoutResult(`${payout}%`, 'success');
          updateDevStatus(`Sucesso! Payout: ${payout}%`, 'success');
          sendStatus(`Payout capturado: ${payout}%`, 'success', 4000, 'fas fa-check-circle');
          logToSystem(`Payout capturado com sucesso: ${payout}% via ${response.selector}`, 'SUCCESS', 'PAYOUT-TEST');
        } else {
          updatePayoutResult('Não encontrado', 'error');
          updateDevStatus(`Falha: ${response?.error || 'Erro desconhecido'}`, 'error');
          sendStatus(`Erro: ${response?.error || 'Payout não encontrado'}`, 'error', 5000, 'fas fa-exclamation-circle');
          logToSystem(`Falha na captura: ${response?.error}`, 'ERROR', 'PAYOUT-TEST');
        }
        
        logToSystem('=== FIM DO TESTE DE PAYOUT ===', 'INFO', 'PAYOUT-TEST');
      } catch (e) {
        updatePayoutResult('Erro', 'error');
        updateDevStatus('Erro na comunicação', 'error');
        sendStatus(`Erro na comunicação: ${e.message}`, 'error', 5000, 'fas fa-exclamation-circle');
        logToSystem(`Erro na comunicação: ${e.message}`, 'ERROR', 'PAYOUT-TEST');
      }
    });
  });
})();
