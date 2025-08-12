// Payout Controller (content-script): captura payout atual do DOM e políticas antes da análise
(function(){
  function parsePercentage(text){
    if (!text) return null;
    const match = String(text).replace(',', '.').match(/(\d{1,3})(?:[.,](\d{1,2}))?\s*%/);
    if (!match) return null;
    const int = parseInt(match[1], 10);
    const dec = match[2] ? parseInt(match[2], 10) : 0;
    return parseFloat(`${int}.${dec}`);
  }

  function findPayoutElement(){
    // Estratégia: procurar elementos com classe/atributo contendo "payout" ou textos com "%"
    const candidates = [
      '[data-testid*="payout" i]',
      '[class*="payout" i]',
      '[id*="payout" i]'
    ];
    for (const selector of candidates){
      const nodes = document.querySelectorAll(selector);
      for (const node of nodes){
        const value = parsePercentage(node.textContent || node.getAttribute('title') || '');
        if (value != null) return { node, value };
      }
    }
    // Varredura leve por spans/divs com %
    const spans = document.querySelectorAll('span,div');
    for (const el of spans){
      const value = parsePercentage(el.textContent);
      if (value != null) return { node: el, value };
    }
    return null;
  }

  async function getCurrentPayout(){
    try {
      const found = findPayoutElement();
      if (!found) {
        window.postMessage({ type: 'LOG_MESSAGE', data: { message: 'Payout não encontrado no DOM', level: 'WARN', source: 'payout-controller' } }, '*');
        return { success: false, error: 'PAYOUT_NOT_FOUND' };
      }
      const payload = { success: true, payout: found.value };
      window.postMessage({ type: 'LOG_MESSAGE', data: { message: `Payout atual: ${found.value}%`, level: 'INFO', source: 'payout-controller' } }, '*');
      return payload;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async function checkPayoutBeforeAnalysis(policy, minPayout = 80, waitMs = 10000, pollMs = 800){
    const start = Date.now();
    if (policy === 'wait'){
      while (Date.now() - start < waitMs){
        const res = await getCurrentPayout();
        if (res.success && res.payout >= minPayout) return { success: true, payout: res.payout, strategy: 'wait' };
        await new Promise(r => setTimeout(r, pollMs));
      }
      return { success: false, error: 'TIMEOUT_MIN_PAYOUT', strategy: 'wait' };
    }
    if (policy === 'switch'){
      // Solicita ao asset-manager para trocar para o melhor ativo
      const switchResp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'SWITCH_BEST_ASSET', minPayout }, resolve);
      });
      if (!switchResp?.success) return { success: false, error: switchResp?.error || 'SWITCH_FAILED', strategy: 'switch' };
      const res = await getCurrentPayout();
      return { success: !!res.success, payout: res.payout, strategy: 'switch' };
    }
    return { success: false, error: 'UNKNOWN_POLICY' };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let isAsync = false;
    try {
      switch (message?.action) {
        case 'GET_CURRENT_PAYOUT': {
          isAsync = true;
          (async () => sendResponse(await getCurrentPayout()))();
          break;
        }
        case 'CHECK_PAYOUT_BEFORE_ANALYSIS': {
          isAsync = true;
          (async () => sendResponse(await checkPayoutBeforeAnalysis(message.policy, message.minPayout, message.waitMs, message.pollMs)))();
          break;
        }
        default:
          break;
      }
    } catch (e) {
      sendResponse({ success: false, error: e.message });
    }
    return isAsync;
  });
})();


