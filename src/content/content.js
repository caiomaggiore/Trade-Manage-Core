// Content script: injeta iframe e faz a ponte com a página
(function(){
  function injectUI(){
    const iframe = document.createElement('iframe');
    iframe.id = 'tmc-iframe';
    iframe.style.cssText = 'position:fixed;right:0;top:0;width:480px;height:100vh;border:none;z-index:999999;background:#fafafa;box-shadow:-2px 0 10px rgba(0,0,0,.1)';
    iframe.src = chrome.runtime.getURL('src/layout/index.html');
    document.body.appendChild(iframe);
    document.body.style.marginRight = '480px';
  }

  // Toggle via atalho (opcionalmente usar commands no futuro)
  function toggleUI(){
    const el = document.getElementById('tmc-iframe');
    if (!el) return injectUI();
    const hidden = el.style.display === 'none';
    el.style.display = hidden ? 'block' : 'none';
    document.body.style.marginRight = hidden ? '480px' : '0';
  }

  // Injeta ao carregar
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectUI);
  else injectUI();

  // Atalho simples
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'Y') toggleUI();
  });
})();
