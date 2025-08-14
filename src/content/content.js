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

  // ===== FUNÇÕES DE CAPTURA DOM (baseadas no projeto original) =====
  
  function logToSystem(message, level = 'INFO', source = 'content.js') {
    window.postMessage({ 
      type: 'LOG_MESSAGE', 
      data: { message, level, source } 
    }, '*');
  }

  // Função simples para capturar payout com XPath e CSS
  function capturePayoutFromDOM() {
    try {
      logToSystem('=== INICIANDO CAPTURA DE PAYOUT ===', 'INFO');
      
      // 1. Tenta primeiro com XPath fornecido pelo usuário
      try {
        const xpath = '//*[@id="put-call-buttons-chart-1"]/div/div[2]/div[1]/div[2]/div/div/div[1]';
        const xpathResult = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const xpathElement = xpathResult.singleNodeValue;
        
        logToSystem(`Testando XPath: ${xpath}`, 'DEBUG');
        
        if (xpathElement) {
          const text = xpathElement.textContent || xpathElement.innerText || '';
          logToSystem(`XPath encontrou elemento! Texto: "${text}"`, 'SUCCESS');
          
          // Busca por números seguidos de %
          const percentMatch = text.match(/(\d{1,3}(?:[.,]\d{1,2})?)\s*%/);
          if (percentMatch) {
            const value = parseFloat(percentMatch[1].replace(',', '.'));
            logToSystem(`Payout extraído via XPath: ${value}%`, 'SUCCESS');
            return { 
              success: true, 
              payout: value, 
              element: xpathElement,
              selector: 'xpath',
              text: text 
            };
          }
        } else {
          logToSystem('XPath não encontrou elemento', 'WARN');
        }
      } catch (xpathError) {
        logToSystem(`Erro no XPath: ${xpathError.message}`, 'ERROR');
      }

      // 2. Tenta com o seletor CSS mais específico baseado no HTML fornecido
      const cssSelectors = [
        '.value__val-start',
        '#put-call-buttons-chart-1 .value__val-start',
        '.block--payout .value__val-start',
        '.estimated-profit-block__percent'
      ];

      for (const selector of cssSelectors) {
        try {
          logToSystem(`Testando CSS: ${selector}`, 'DEBUG');
          const elements = document.querySelectorAll(selector);
          logToSystem(`CSS "${selector}" encontrou ${elements.length} elementos`, 'DEBUG');
          
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const text = element.textContent || element.innerText || '';
            logToSystem(`Elemento ${i+1}: "${text}"`, 'DEBUG');
            
            // Busca por padrão de porcentagem
            const percentMatch = text.match(/(\d{1,3}(?:[.,]\d{1,2})?)\s*%/);
            if (percentMatch) {
              const value = parseFloat(percentMatch[1].replace(',', '.'));
              if (value >= 50 && value <= 200) {
                logToSystem(`Payout válido encontrado via CSS: ${value}%`, 'SUCCESS');
                return { 
                  success: true, 
                  payout: value, 
                  element: element,
                  selector: selector,
                  text: text 
                };
              }
            }
          }
        } catch (e) {
          logToSystem(`Erro no CSS ${selector}: ${e.message}`, 'ERROR');
        }
      }

      // 3. Busca geral por elementos com texto que contém %
      logToSystem('Fazendo busca geral por elementos com %...', 'DEBUG');
      const allElements = document.querySelectorAll('*');
      let found = 0;
      
      for (const el of allElements) {
        const text = (el.textContent || '').trim();
        if (text.includes('%') && text.length < 50 && !el.children.length) {
          found++;
          logToSystem(`Elemento ${found}: "${text}" (tag: ${el.tagName}, classes: ${el.className})`, 'DEBUG');
          
          const percentMatch = text.match(/(\d{1,3}(?:[.,]\d{1,2})?)\s*%/);
          if (percentMatch) {
            const value = parseFloat(percentMatch[1].replace(',', '.'));
            if (value >= 50 && value <= 200) {
              logToSystem(`Payout encontrado na busca geral: ${value}%`, 'SUCCESS');
              return { 
                success: true, 
                payout: value, 
                element: el,
                selector: 'busca-geral',
                text: text 
              };
            }
          }
        }
      }
      
      logToSystem(`Busca geral concluída. ${found} elementos com % analisados`, 'DEBUG');
      logToSystem('=== PAYOUT NÃO ENCONTRADO ===', 'ERROR');
      return { success: false, error: 'PAYOUT_NOT_FOUND' };
      
    } catch (error) {
      logToSystem(`Erro na captura de payout: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // Função para capturar informações do gráfico
  function captureChartInfo() {
    try {
      logToSystem('Iniciando captura de informações do gráfico...', 'DEBUG');
      
      const chartSelectors = [
        'canvas[class*="chart"]',
        'canvas[class*="trading"]', 
        '#chart canvas',
        '.chart-container canvas',
        '.tradingview-widget canvas',
        'canvas[width][height]'
      ];

      for (const selector of chartSelectors) {
        const elements = document.querySelectorAll(selector);
        logToSystem(`Seletor ${selector}: ${elements.length} elementos`, 'DEBUG');
        
        for (const canvas of elements) {
          const rect = canvas.getBoundingClientRect();
          if (rect.width > 100 && rect.height > 100) {
            const info = {
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              element: canvas.tagName.toLowerCase(),
              selector: selector
            };
            logToSystem(`Gráfico encontrado: ${info.width}x${info.height}`, 'SUCCESS');
            return { success: true, ...info };
          }
        }
      }
      
      logToSystem('Gráfico não encontrado', 'WARN');
      return { success: false, error: 'CHART_NOT_FOUND' };
      
    } catch (error) {
      logToSystem(`Erro na captura do gráfico: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // Função para controlar modal de ativos
  function controlAssetModal(action) {
    try {
      logToSystem(`Tentando ${action} modal de ativos...`, 'DEBUG');
      
      // Seletores para botão que abre modal
      const triggerSelectors = [
        '.current-option',
        '.asset-selector',
        '.symbol-name',
        '[class*="current-symbol"]',
        '[class*="asset-button"]'
      ];

      // Seletores para detectar modal aberto
      const modalSelectors = [
        '.modal[style*="block"]',
        '.popup[style*="block"]',
        '[class*="modal"][class*="open"]',
        '[class*="popup"][class*="open"]'
      ];

      if (action === 'toggle' || action === 'open') {
        for (const selector of triggerSelectors) {
          const elements = document.querySelectorAll(selector);
          logToSystem(`Trigger seletor ${selector}: ${elements.length} elementos`, 'DEBUG');
          
          for (const element of elements) {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              logToSystem(`Clicando em elemento: ${element.className}`, 'DEBUG');
              element.click();
              
              // Aguarda um pouco e verifica se modal abriu
              setTimeout(() => {
                const modalOpen = modalSelectors.some(sel => 
                  document.querySelectorAll(sel).length > 0
                );
                logToSystem(`Modal ${modalOpen ? 'aberto' : 'falhou ao abrir'}`, modalOpen ? 'SUCCESS' : 'WARN');
              }, 300);
              
              return { success: true, action: 'triggered' };
            }
          }
        }
      }

      if (action === 'toggle' || action === 'close') {
        // Tenta fechar pressionando ESC
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        logToSystem('ESC enviado para fechar modal', 'DEBUG');
        return { success: true, action: 'esc-sent' };
      }

      return { success: false, error: 'NO_SUITABLE_ELEMENT_FOUND' };
      
    } catch (error) {
      logToSystem(`Erro no controle do modal: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // ===== LISTENERS PARA COMUNICAÇÃO =====
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    logToSystem(`Recebida mensagem: ${message?.action}`, 'DEBUG');
    
    try {
      switch (message?.action) {
        case 'CAPTURE_PAYOUT_FROM_DOM':
          logToSystem('Executando CAPTURE_PAYOUT_FROM_DOM...', 'INFO');
          const result = capturePayoutFromDOM();
          logToSystem(`Resultado da captura: ${JSON.stringify(result)}`, 'DEBUG');
          sendResponse(result);
          break;
          
        case 'CAPTURE_CHART_INFO':
          sendResponse(captureChartInfo());
          break;
          
        case 'CONTROL_ASSET_MODAL':
          sendResponse(controlAssetModal(message.modalAction || 'toggle'));
          break;
          
        default:
          logToSystem(`Ação não reconhecida: ${message?.action}`, 'WARN');
          sendResponse({ success: false, error: 'ACTION_NOT_HANDLED' });
          break;
      }
    } catch (e) {
      logToSystem(`Erro no listener do content.js: ${e.message}`, 'ERROR');
      sendResponse({ success: false, error: e.message });
    }
    
    return false; // resposta síncrona
  });

  // Injeta ao carregar
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectUI);
  else injectUI();

  // Atalho simples
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'Y') toggleUI();
  });

  // Logs de inicialização
  logToSystem('=== CONTENT SCRIPT INICIALIZADO ===', 'SUCCESS');
  logToSystem(`Listeners registrados: CAPTURE_PAYOUT_FROM_DOM, CAPTURE_CHART_INFO, CONTROL_ASSET_MODAL`, 'INFO');
  logToSystem(`DOM ready state: ${document.readyState}`, 'DEBUG');
  logToSystem(`URL atual: ${window.location.href}`, 'DEBUG');
})();
