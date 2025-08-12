// Navegação/paginação dentro do iframe principal (sem abrir nova janela)
(function(){
  function getOverlay(){ return document.getElementById('tmc-subpage-overlay'); }
  function getFrame(){ return document.getElementById('tmc-subpage-frame'); }
  function getFooter(){ return document.querySelector('.app-footer'); }

  function ensureElements(){
    const overlay = getOverlay();
    const frame = getFrame();
    return !!overlay && !!frame;
  }

  const NAV = {
    openInFrame(path){
      if (!ensureElements()) return;
      const overlay = getOverlay();
      const frame = getFrame();
      // Ajusta a altura da shell/frame considerando o footer
      const footer = getFooter();
      const footerHeight = footer ? footer.getBoundingClientRect().height : 0;
      const shell = overlay.querySelector('.subpage-shell');
      if (shell) shell.style.bottom = `${footerHeight}px`;
      frame.src = chrome.runtime.getURL(path);
      overlay.style.display = 'block';
    },
    close(){
      const overlay = getOverlay();
      const frame = getFrame();
      if (frame) frame.src = 'about:blank';
      if (overlay) overlay.style.display = 'none';
    },
    openSettings(){ NAV.openInFrame('src/layout/settings.html'); },
    openLogs(){ NAV.openInFrame('src/layout/logs.html'); }
  };

  window.addEventListener('message', (e) => {
    if (e?.data?.type === 'NAV_CLOSE_SUBPAGE') NAV.close();
  });

  window.TMCNavigation = NAV;
})();


