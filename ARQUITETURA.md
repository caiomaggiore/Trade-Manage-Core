## Arquitetura - Trade Manager Core

- UI (iframe): src/layout/index.html, settings.html, logs.html
  - Scripts carregados no iframe: log-sys.js, state-manager.js, index.js, capture-screen.js
  - Comunicação interna do iframe: window.postMessage (LOG_MESSAGE, UPDATE_STATUS)
- Content Script: src/content/content.js
  - Injeta o iframe na página, recebe mensagens do iframe e aciona Background / DOM
- Background (SW): src/background/background.js
  - Captura de tela via chrome.tabs.captureVisibleTab
  - Orquestra chamadas assíncronas; sempre garante eturn true em listeners que respondem async
- Exposição de funções
  - Entre contextos: chrome.runtime.sendMessage({ action, payload })
  - Dentro do iframe: window.sendLog, window.sendStatus, window.logToSystem
