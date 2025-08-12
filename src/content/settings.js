// Lógica da página de Configurações (sem inline script)
(async function(){
  try {
    const cfg = await window.StateManager.load();
    const valueEl = document.getElementById('trade-value');
    const timeEl = document.getElementById('trade-time');
    const payoutEl = document.getElementById('min-payout');
    const saveBtn = document.getElementById('save-settings');
    const closeBtn = document.getElementById('close-settings');

    if (valueEl) valueEl.value = cfg.value || 10;
    if (timeEl) timeEl.value = cfg.period || 0;
    if (payoutEl) payoutEl.value = cfg.minPayout || 80;

    if (saveBtn) saveBtn.onclick = async () => {
      await window.StateManager.saveConfig({
        value: parseFloat(valueEl.value)||10,
        period: parseInt(timeEl.value)||0,
        minPayout: parseInt(payoutEl.value)||80
      });
      window.sendStatus('Configurações salvas', 'success');
    };

    if (closeBtn) closeBtn.onclick = () => window.parent?.postMessage({ type: 'NAV_CLOSE_SUBPAGE' }, '*');
  } catch (e) {
    console.error('Erro em settings.js:', e);
  }
})();


