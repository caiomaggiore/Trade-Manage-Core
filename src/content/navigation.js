// Sistema de Navegação SPA com Slide Lateral
(function(){
  function getOverlay(){ return document.getElementById('tmc-subpage-overlay'); }
  function getContent(){ return document.getElementById('tmc-subpage-content'); }
  function getFooter(){ return document.querySelector('.app-footer'); }

  function ensureElements(){
    const overlay = getOverlay();
    const content = getContent();
    const hasElements = !!overlay && !!content;
    
    if (!hasElements) {
      window.logToSystem?.('Elementos críticos de navegação não encontrados na DOM', 'ERROR', 'NAVIGATION');
    }
    
    return hasElements;
  }

  const NAV = {
    async loadContent(path){
      if (!ensureElements()) return false;
      
      try {
        const response = await fetch(chrome.runtime.getURL(path));
        if (!response.ok) throw new Error(`Failed to load ${path}`);
        
        const html = await response.text();
        const content = getContent();
        content.innerHTML = html;
        
        // Executa scripts da página carregada
        const scripts = content.querySelectorAll('script[src]');
        for (const script of scripts) {
          const newScript = document.createElement('script');
          newScript.src = script.src;
          newScript.async = false;
          document.head.appendChild(newScript);
        }
        
        // Adiciona event listeners para botões de fechar
        const closeButtons = content.querySelectorAll('#close-settings, #close-logs');
        closeButtons.forEach(btn => {
          btn.addEventListener('click', () => NAV.close());
        });
        
        return true;
      } catch (error) {
        window.logToSystem?.(`Falha crítica ao carregar página ${path}: ${error.message}`, 'ERROR', 'NAVIGATION');
        sendStatus(`Erro ao carregar página: ${error.message}`, 'error', 5000);
        return false;
      }
    },

    async openInSlide(path){
      if (!ensureElements()) return;
      
      const overlay = getOverlay();
      const success = await NAV.loadContent(path);
      
      if (success) {
        // Força reflow para aplicar estilos iniciais
        overlay.offsetHeight;
        
        // Adiciona classe active para triggerar animação
        overlay.classList.add('active');
        
        // Log da navegação
        const pageName = path.includes('settings') ? 'Configurações' : 
                        path.includes('logs') ? 'Logs' : 'Página';
        const pageIcon = path.includes('settings') ? 'fas fa-cog' : 
                        path.includes('logs') ? 'fas fa-list' : 'fas fa-file';
        
        sendStatus(`Carregando ${pageName}...`, 'info', 2000, pageIcon);
      }
    },

    close(){
      const overlay = getOverlay();
      const content = getContent();
      
      if (overlay) {
        // Remove classe active para triggerar animação de saída
        overlay.classList.remove('active');
        
        // Limpa conteúdo após animação
        setTimeout(() => {
          if (content) content.innerHTML = '';
        }, 300); // Aguarda animação completar
        
        sendStatus('Voltando ao painel principal...', 'info', 1500, 'fas fa-home');
      }
    },

    // Métodos específicos para cada página
    openSettings(){ 
      NAV.openInSlide('src/layout/settings.html'); 
    },
    
    openLogs(){ 
      NAV.openInSlide('src/layout/logs.html'); 
    }
  };

  // Listener para fechar com clique fora (opcional)
  document.addEventListener('click', (e) => {
    const overlay = getOverlay();
    if (overlay && overlay.classList.contains('active') && e.target === overlay) {
      NAV.close();
    }
  });

  // Listener para tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const overlay = getOverlay();
      if (overlay && overlay.classList.contains('active')) {
        NAV.close();
      }
    }
  });

  // Listener para mensagens de fechamento
  window.addEventListener('message', (e) => {
    if (e?.data?.type === 'NAV_CLOSE_SUBPAGE') {
      NAV.close();
    }
  });

  // Expõe API global
  window.TMCNavigation = NAV;
  
  // Sistema inicializado (sem log - ação visível para o usuário)
})();