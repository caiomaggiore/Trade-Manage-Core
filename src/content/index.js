// Controller dentro do iframe
(function(){
  const statusEl = () => document.getElementById('status-processo');
  const versionEl = () => document.getElementById('app-version');

  // Recebe UPDATE_STATUS interno do iframe
  window.addEventListener('message', (event) => {
    if (event?.data?.type === 'UPDATE_STATUS') {
      const { message, type = 'info', duration = 3000 } = event.data.data || {};
      const bodyStatus = statusEl();
      const footerStatus = document.querySelector('.footer-status');
      const targets = [bodyStatus, footerStatus].filter(Boolean);
      if (targets.length === 0) return;
      for (const el of targets){
        el.className = `status-processo ${type}`;
        el.textContent = message;
      }
      if (duration > 0) setTimeout(() => targets.forEach(el => el && (el.textContent = 'Pronto')), duration);
    }
  });

  // Bind de botões básicos
  document.addEventListener('DOMContentLoaded', () => {
    // Exibe versão do manifest no footer
    try {
      const vEl = versionEl();
      if (vEl) vEl.textContent = chrome.runtime.getManifest?.().version || '-';
    } catch(_) {}
    const btnCapture = document.getElementById('captureBtn');
    const btnAnalyze = document.getElementById('analyzeBtn');
    const btnSettings = document.getElementById('settings-btn');
    const btnLogs = document.getElementById('logs-btn');
    const overlay = document.getElementById('tmc-subpage-overlay');
    if (btnCapture) btnCapture.addEventListener('click', async () => {
      try {
        sendStatus('Capturando tela...', 'info');
        const img = await window.CaptureScreen.capture();
        sendStatus('Captura concluída', 'success');
        const popup = window.open('', '_blank', 'width=720,height=520');
        if (popup && popup.document) {
          popup.document.title = 'Captura de Tela';
          popup.document.body.style.margin = '0';
          popup.document.body.style.background = '#0b1020';
          const image = popup.document.createElement('img');
          image.src = img;
          image.style.maxWidth = '100%';
          image.style.maxHeight = '100vh';
          image.style.display = 'block';
          image.style.margin = '0 auto';
          popup.document.body.appendChild(image);
        }
      } catch (e) { sendStatus('Erro na captura: ' + e.message, 'error', 5000); }
    });
    if (btnAnalyze) btnAnalyze.addEventListener('click', async () => {
      sendStatus('Análise básica iniciada...', 'info');
      // Placeholder para orquestração futura
      setTimeout(() => sendStatus('Análise concluída (mock)', 'success'), 800);
    });

    if (btnSettings) btnSettings.addEventListener('click', () => window.TMCNavigation?.openSettings());
    if (btnLogs) btnLogs.addEventListener('click', () => window.TMCNavigation?.openLogs());
    if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) window.TMCNavigation?.close(); });
  });
})();
