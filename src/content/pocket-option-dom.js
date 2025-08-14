// Pocket Option DOM Controller - Baseado no projeto original Trade Manager Pro
(function(){
  
  // ===== SELETORES ESPECÍFICOS DA POCKET OPTION (do content.js original) =====
  const SELECTORS = {
    // Modal de Ativos - Baseado nas funções do content.js original
    assetModal: {
      // Seletores para encontrar o botão que abre o modal
      trigger: [
        '.iq-popup-content-button.iq-current-option',
        '.current-symbol',
        '.asset-selector',
        '[class*="current-option"]',
        '.symbol-name'
      ],
      // Seletores para detectar se o modal está aberto
      modal: [
        '.iq-option-popup.opened',
        '.modal-asset-chooser.opened',
        '.asset-popup.active',
        '[class*="asset-popup"][class*="opened"]',
        '.popup[style*="block"]'
      ],
      // Seletores para fechar o modal
      closeBtn: [
        '.modal-header .close',
        '.popup-close',
        '.iq-popup-close',
        '[class*="close"]'
      ],
      // Seletores para listar os ativos
      assetList: [
        '.iq-option-dropdown-options',
        '.asset-list',
        '.symbols-list',
        '[class*="asset-item"]'
      ]
    },
    
    // Payout - Baseado no payout-controller.js original
    payout: {
      containers: [
        '.option-profit',
        '.payout-info',
        '.profit-percent',
        '[class*="profit"]',
        '[class*="payout"]'
      ],
      // Padrões específicos encontrados no original
      specific: [
        '.option-profit .profit-percent',
        '.payout .percent-value',
        '.trade-info .profit'
      ]
    },
    
    // Gráfico - Baseado no dev-tools.js original (função getCanvasInfo)
    chart: {
      canvas: [
        'canvas[class*="chart"]',
        '#chart canvas',
        '.tradingview-widget canvas',
        'canvas[width][height]'
      ],
      container: [
        '#chart-container',
        '.chart-wrapper',
        '.tradingview-widget',
        '[class*="chart-container"]'
      ]
    },
    
    // Controles de Trading
    trading: {
      amountInput: [
        'input[class*="amount"]',
        'input[class*="investment"]',
        '.amount-input input',
        '[data-field="amount"] input'
      ],
      timeSelect: [
        'select[class*="time"]',
        'select[class*="period"]',
        '.time-selector select',
        '[data-field="period"] select'
      ],
      buttons: {
        buy: [
          '.btn-call',
          '.buy-button',
          '[class*="call-button"]',
          '.up-button'
        ],
        sell: [
          '.btn-put',
          '.sell-button',
          '[class*="put-button"]',
          '.down-button'
        ]
      }
    }
  };

  // ===== FUNÇÕES UTILITÁRIAS =====
  function findElementsBySelectors(selectors) {
    if (typeof selectors === 'string') selectors = [selectors];
    
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          return Array.from(elements);
        }
      } catch (e) {
        console.warn('Seletor inválido:', selector, e);
      }
    }
    return [];
  }

  function findVisibleElement(selectors) {
    const elements = findElementsBySelectors(selectors);
    
    return elements.find(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && 
             style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             style.opacity !== '0';
    }) || null;
  }

  function logToSystem(message, level = 'INFO', source = 'pocket-option-dom') {
    window.postMessage({ 
      type: 'LOG_MESSAGE', 
      data: { message, level, source } 
    }, '*');
  }

  // ===== MODAL DE ATIVOS - Baseado no content.js original =====
  const AssetModal = {
    // Verifica se o modal está aberto (baseado na função isModalOpen do original)
    isOpen() {
      const modal = findVisibleElement(SELECTORS.assetModal.modal);
      if (modal) {
        logToSystem(`Modal detectado: ${modal.className}`, 'DEBUG');
        return true;
      }
      return false;
    },

    // Abre o modal (baseado na função executeOpenWithTimeout do original)
    async open() {
      try {
        if (this.isOpen()) {
          return { success: true, message: 'ALREADY_OPEN' };
        }

        const trigger = findVisibleElement(SELECTORS.assetModal.trigger);
        if (!trigger) {
          logToSystem('Botão para abrir modal não encontrado', 'ERROR');
          return { success: false, error: 'TRIGGER_NOT_FOUND' };
        }

        logToSystem(`Clicando no trigger: ${trigger.className}`, 'DEBUG');
        trigger.click();
        
        // Aguarda o modal aparecer (com timeout)
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 200));
          if (this.isOpen()) {
            logToSystem('Modal de ativos aberto com sucesso', 'SUCCESS');
            return { success: true, action: 'open' };
          }
          attempts++;
        }
        
        logToSystem('Timeout ao aguardar modal abrir', 'ERROR');
        return { success: false, error: 'OPEN_TIMEOUT' };
      } catch (e) {
        logToSystem(`Erro ao abrir modal: ${e.message}`, 'ERROR');
        return { success: false, error: e.message };
      }
    },

    // Fecha o modal (baseado na função executeCloseWithTimeout do original)
    async close() {
      try {
        if (!this.isOpen()) {
          return { success: true, message: 'ALREADY_CLOSED' };
        }

        // Tenta fechar pelo botão de fechar
        const closeBtn = findVisibleElement(SELECTORS.assetModal.closeBtn);
        if (closeBtn) {
          logToSystem(`Clicando no botão fechar: ${closeBtn.className}`, 'DEBUG');
          closeBtn.click();
        } else {
          // Tenta pressionar ESC
          logToSystem('Tentando fechar com ESC', 'DEBUG');
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }

        // Aguarda o modal fechar
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 200));
          if (!this.isOpen()) {
            logToSystem('Modal de ativos fechado com sucesso', 'SUCCESS');
            return { success: true, action: 'close' };
          }
          attempts++;
        }
        
        logToSystem('Timeout ao aguardar modal fechar', 'ERROR');
        return { success: false, error: 'CLOSE_TIMEOUT' };
      } catch (e) {
        logToSystem(`Erro ao fechar modal: ${e.message}`, 'ERROR');
        return { success: false, error: e.message };
      }
    },

    // Alterna estado do modal
    async toggle() {
      return this.isOpen() ? await this.close() : await this.open();
    },

    // Lista ativos disponíveis
    listAssets() {
      try {
        if (!this.isOpen()) {
          return { success: false, error: 'MODAL_NOT_OPEN' };
        }

        const assetElements = findElementsBySelectors(SELECTORS.assetModal.assetList);
        if (!assetElements.length) {
          return { success: false, error: 'NO_ASSETS_FOUND' };
        }

        const assets = [];
        assetElements.forEach(el => {
          const name = el.textContent?.trim() || 
                      el.getAttribute('data-asset') ||
                      el.getAttribute('data-symbol');
          
          if (name && !assets.includes(name)) {
            assets.push(name);
          }
        });

        logToSystem(`${assets.length} ativos encontrados`, 'INFO');
        return { success: true, assets, count: assets.length };
      } catch (e) {
        logToSystem(`Erro ao listar ativos: ${e.message}`, 'ERROR');
        return { success: false, error: e.message };
      }
    }
  };

  // ===== DETECTOR DE PAYOUT - Baseado no payout-controller.js original =====
  const PayoutDetector = {
    // Parse de porcentagem mais robusto
    parsePercentage(text) {
      if (!text) return null;
      
      // Remove espaços e converte vírgula para ponto
      const cleanText = String(text).replace(/\s+/g, '').replace(',', '.');
      
      // Padrões de busca
      const patterns = [
        /(\d{1,3}(?:\.\d{1,2})?)\s*%/,        // 85.5%
        /(\d{1,3}(?:\.\d{1,2})?)\s*percent/i, // 85.5 percent
        /(\d{1,3}(?:\.\d{1,2})?)$/             // apenas número
      ];
      
      for (const pattern of patterns) {
        const match = cleanText.match(pattern);
        if (match) {
          const value = parseFloat(match[1]);
          // Valida se é um payout válido (50% a 200%)
          if (!isNaN(value) && value >= 50 && value <= 200) {
            return value;
          }
        }
      }
      return null;
    },

    // Encontra elemento de payout (baseado no método original)
    findPayoutElement() {
      // Primeiro, tenta seletores específicos
      for (const selector of SELECTORS.payout.specific) {
        const elements = findElementsBySelectors([selector]);
        for (const el of elements) {
          const value = this.parsePercentage(el.textContent);
          if (value !== null) {
            return { element: el, value, selector };
          }
        }
      }

      // Depois, tenta containers genéricos
      for (const selector of SELECTORS.payout.containers) {
        const elements = findElementsBySelectors([selector]);
        for (const el of elements) {
          const value = this.parsePercentage(el.textContent);
          if (value !== null) {
            return { element: el, value, selector };
          }
        }
      }

      // Por último, busca geral por spans/divs com %
      const allSpans = document.querySelectorAll('span, div');
      for (const span of allSpans) {
        const value = this.parsePercentage(span.textContent);
        if (value !== null) {
          return { element: span, value, selector: 'general-scan' };
        }
      }

      return null;
    },

    // Captura payout atual
    getCurrentPayout() {
      try {
        const found = this.findPayoutElement();
        if (!found) {
          logToSystem('Payout não encontrado no DOM', 'WARN');
          return { success: false, error: 'PAYOUT_NOT_FOUND' };
        }

        logToSystem(`Payout encontrado: ${found.value}% (${found.selector})`, 'SUCCESS');
        return { 
          success: true, 
          payout: found.value, 
          element: found.element,
          selector: found.selector 
        };
      } catch (e) {
        logToSystem(`Erro ao capturar payout: ${e.message}`, 'ERROR');
        return { success: false, error: e.message };
      }
    }
  };

  // ===== DETECTOR DE GRÁFICO - Baseado no dev-tools.js original =====
  const ChartDetector = {
    // Encontra elemento do gráfico (baseado na função getCanvasInfo)
    findChartElement() {
      // Primeiro, tenta encontrar canvas do gráfico
      for (const selector of SELECTORS.chart.canvas) {
        const canvas = findVisibleElement([selector]);
        if (canvas && canvas.width > 100 && canvas.height > 100) {
          return canvas;
        }
      }

      // Depois, tenta containers do gráfico
      for (const selector of SELECTORS.chart.container) {
        const container = findVisibleElement([selector]);
        if (container) {
          // Procura canvas dentro do container
          const canvas = container.querySelector('canvas');
          if (canvas && canvas.width > 100 && canvas.height > 100) {
            return canvas;
          }
          return container;
        }
      }

      return null;
    },

    // Captura dimensões do gráfico (baseado na função captureCanvasInfo)
    getChartDimensions() {
      try {
        const chartElement = this.findChartElement();
        if (!chartElement) {
          logToSystem('Elemento do gráfico não encontrado', 'ERROR');
          return { success: false, error: 'CHART_NOT_FOUND' };
        }

        const rect = chartElement.getBoundingClientRect();
        const dimensions = {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          element: chartElement.tagName.toLowerCase(),
          id: chartElement.id || 'sem-id',
          classes: chartElement.className || 'sem-classes'
        };

        logToSystem(`Gráfico encontrado: ${dimensions.width}x${dimensions.height} em (${dimensions.x}, ${dimensions.y})`, 'SUCCESS');
        return { success: true, ...dimensions };
      } catch (e) {
        logToSystem(`Erro ao detectar dimensões: ${e.message}`, 'ERROR');
        return { success: false, error: e.message };
      }
    }
  };

  // ===== CONTROLES DE TRADING =====
  const TradingControls = {
    findAmountInput() {
      return findVisibleElement(SELECTORS.trading.amountInput);
    },

    findTimeSelect() {
      return findVisibleElement(SELECTORS.trading.timeSelect);
    },

    findTradeButtons() {
      return {
        buy: findVisibleElement(SELECTORS.trading.buttons.buy),
        sell: findVisibleElement(SELECTORS.trading.buttons.sell)
      };
    },

    getTradingInfo() {
      try {
        const amountInput = this.findAmountInput();
        const timeSelect = this.findTimeSelect();
        const buttons = this.findTradeButtons();

        const info = {
          amount: amountInput ? amountInput.value : null,
          time: timeSelect ? timeSelect.value : null,
          hasControls: {
            amount: !!amountInput,
            time: !!timeSelect,
            buy: !!buttons.buy,
            sell: !!buttons.sell
          }
        };

        const foundControls = Object.values(info.hasControls).filter(Boolean).length;
        logToSystem(`Controles encontrados: ${foundControls}/4`, foundControls > 0 ? 'SUCCESS' : 'WARN');
        
        return { success: foundControls > 0, ...info };
      } catch (e) {
        logToSystem(`Erro ao detectar controles: ${e.message}`, 'ERROR');
        return { success: false, error: e.message };
      }
    }
  };

  // ===== EXPOSIÇÃO GLOBAL =====
  window.PocketOptionDOM = {
    AssetModal,
    PayoutDetector,
    ChartDetector,
    TradingControls,
    SELECTORS,
    utils: {
      findElementsBySelectors,
      findVisibleElement,
      logToSystem
    }
  };

  // ===== LISTENERS PARA MENSAGENS =====
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let isAsync = false;
    
    try {
      switch (message?.action) {
        case 'TOGGLE_ASSET_MODAL':
          isAsync = true;
          (async () => sendResponse(await AssetModal.toggle()))();
          break;
          
        case 'OPEN_ASSET_MODAL':
          isAsync = true;
          (async () => sendResponse(await AssetModal.open()))();
          break;
          
        case 'CLOSE_ASSET_MODAL':
          isAsync = true;
          (async () => sendResponse(await AssetModal.close()))();
          break;

        case 'CHECK_MODAL_STATUS':
          sendResponse({ success: true, isOpen: AssetModal.isOpen() });
          break;
          
        case 'LIST_MODAL_ASSETS':
          sendResponse(AssetModal.listAssets());
          break;
          
        case 'GET_CHART_DIMENSIONS':
          sendResponse(ChartDetector.getChartDimensions());
          break;
          
        case 'GET_TRADING_INFO':
          sendResponse(TradingControls.getTradingInfo());
          break;
          
        default:
          break;
      }
    } catch (e) {
      logToSystem(`Erro no listener: ${e.message}`, 'ERROR');
      sendResponse({ success: false, error: e.message });
    }
    
    return isAsync;
  });

  logToSystem('PocketOptionDOM carregado com funcionalidades baseadas no projeto original', 'SUCCESS');

})();
