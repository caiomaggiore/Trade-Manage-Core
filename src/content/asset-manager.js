// Asset Manager (content-script): lista e troca ativos no DOM
(function(){
  function queryAssetNodes(){
    // Usa o detector específico da Pocket Option se disponível
    if (window.PocketOptionDOM) {
      const result = window.PocketOptionDOM.AssetModal.listAssets();
      if (result.success) {
        return result.assets.map(name => ({ 
          textContent: name, 
          getAttribute: () => name 
        }));
      }
    }

    // Fallback: seletores baseados no projeto original
    const selectors = [
      '.iq-option-dropdown-options .option',
      '.asset-list .asset-item',
      '.symbols-list .symbol',
      '[data-asset]',
      '[class*="asset" i]'
    ];
    
    const buttons = [];
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      buttons.push(...Array.from(elements));
    }
    
    return buttons;
  }

  function listAssets(){
    // Usa o detector específico da Pocket Option se disponível
    if (window.PocketOptionDOM) {
      const result = window.PocketOptionDOM.AssetModal.listAssets();
      if (result.success) {
        return { success: true, assets: result.assets, count: result.count };
      }
    }

    // Fallback: método original melhorado
    const nodes = queryAssetNodes();
    const assets = [];
    for (const n of nodes){
      const name = n.getAttribute('data-asset') || 
                  n.getAttribute('data-symbol') ||
                  n.textContent?.trim() || '';
      if (name && name.length > 1 && !assets.includes(name)) {
        assets.push(name);
      }
    }
    
    return { success: true, assets, count: assets.length };
  }

  async function switchTo(asset){
    const nodes = queryAssetNodes();
    const target = nodes.find(n => (n.getAttribute('data-asset')||'').trim() === asset || (n.textContent||'').trim() === asset);
    if (!target) return { success: false, error: 'ASSET_NOT_FOUND' };
    target.click();
    window.postMessage({ type: 'LOG_MESSAGE', data: { message: `Troca de ativo: ${asset}`, level: 'INFO', source: 'asset-manager' } }, '*');
    return { success: true, asset };
  }

  async function switchToBest(minPayout = 80){
    // Estratégia simples: manter ativo atual se payout ok; senão tentar próximos (placeholder)
    const payout = await new Promise(resolve => chrome.runtime.sendMessage({ action: 'GET_CURRENT_PAYOUT' }, resolve));
    if (payout?.success && payout.payout >= minPayout) return { success: true, kept: true, payout: payout.payout };
    const listed = listAssets();
    for (const name of listed.assets){
      await switchTo(name);
      const p = await new Promise(resolve => chrome.runtime.sendMessage({ action: 'GET_CURRENT_PAYOUT' }, resolve));
      if (p?.success && p.payout >= minPayout) return { success: true, asset: name, payout: p.payout };
    }
    return { success: false, error: 'NO_ASSET_MEETS_MIN_PAYOUT' };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let isAsync = false;
    try {
      switch (message?.action) {
        case 'LIST_ASSETS':
          sendResponse(listAssets());
          break;
        case 'SWITCH_ASSET': {
          isAsync = true;
          (async () => sendResponse(await switchTo(message.asset)))();
          break;
        }
        case 'SWITCH_BEST_ASSET': {
          isAsync = true;
          (async () => sendResponse(await switchToBest(message.minPayout)))();
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


