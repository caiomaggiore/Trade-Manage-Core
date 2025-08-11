// Controller dentro do iframe
(function(){
  const statusEl = () => document.getElementById('status-processo');

  // Recebe UPDATE_STATUS interno do iframe
  window.addEventListener('message', (event) => {
    if (event?.data?.type === 'UPDATE_STATUS') {
      const { message, type = 'info', duration = 3000 } = event.data.data || {};
      const el = statusEl();
      if (!el) return;
      el.className = status-processo ;
      el.textContent = message;
      if (duration > 0) setTimeout(() => el.classList.remove('visible'), duration);
    }
  });

  // Bind de botões básicos
  document.addEventListener('DOMContentLoaded', () => {
    const btnCapture = document.getElementById('captureBtn');
    const btnAnalyze = document.getElementById('analyzeBtn');
    if (btnCapture) btnCapture.addEventListener('click', async () => {
      try {
        sendStatus('Capturando tela...', 'info');
        const img = await window.CaptureScreen.capture();
        sendStatus('Captura concluída', 'success');
        console.log('Imagem base64 (início):', img?.substring(0, 64));
      } catch (e) { sendStatus('Erro na captura: ' + e.message, 'error', 5000); }
    });
    if (btnAnalyze) btnAnalyze.addEventListener('click', async () => {
      sendStatus('Análise básica iniciada...', 'info');
      // Placeholder para orquestração futura
      setTimeout(() => sendStatus('Análise concluída (mock)', 'success'), 800);
    });
  });
})();
