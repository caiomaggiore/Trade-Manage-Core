// Lógica da página de Logs (sem inline script)
(function(){
  const closeBtn = document.getElementById('close-logs');
  if (closeBtn) closeBtn.onclick = () => window.parent?.postMessage({ type: 'NAV_CLOSE_SUBPAGE' }, '*');

  const container = document.getElementById('log-container');
  function appendLine(level, source, message){
    if (!container) return;
    const line = document.createElement('div');
    line.textContent = `[${level}] (${source}) ${message}`;
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
  }

  window.addEventListener('message', (e) => {
    if (e?.data?.type === 'LOG_MESSAGE') {
      const { message = '', level = 'INFO', source = 'CORE' } = e.data.data || {};
      appendLine(level, source, message);
    }
  });
})();


