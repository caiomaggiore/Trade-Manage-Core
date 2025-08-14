## Contexto e Plano de Continuidade

### Objetivo
Criar um core enxuto (MV3) com UI via iframe, logging/status, settings e um painel de desenvolvimento, evitando duplicações e seguindo os princípios do ARQUITETURA.md.

### Decisões Arquiteturais
- UI carregada em iframe a partir de `src/layout/*.html` e controlada por `src/content/index.js`.
- Logs e status enviados via funções globais no iframe: `window.logToSystem`, `window.sendLog`, `window.sendStatus` (interno com `window.postMessage`).
- Entre contextos (iframe/content/background): sempre via `chrome.runtime.sendMessage` e listeners que retornam `true` síncrono quando forem responder de forma assíncrona (evitar "Message Port Closed").
- Não expor funções globais para comunicação entre arquivos. Dentro do iframe, `window.*` apenas para consumo local.
- Uma responsabilidade por arquivo; sem duplicação de lógica entre módulos.

### Estado Atual (entregue)
- `manifest.json` (MV3) válido e mínimo.
- `src/background/background.js`: captura de tela com `chrome.tabs.captureVisibleTab` e roteamento básico de mensagens.
- `src/content/content.js`: injeta o iframe na página e provê toggle (atalho Ctrl+Shift+Y).
- `src/content/log-sys.js`: sistema de logs/status globais no iframe.
- `src/content/state-manager.js`: configuração mínima em `chrome.storage.sync`.
- `src/content/capture-screen.js`: API de captura para a UI (chama o Background).
- `src/layout/index.html`, `src/layout/settings.html`, `src/layout/logs.html`.
- `src/assets/styles/style.css`.

### Padrões de Comunicação (MV3)
- Interno do iframe: `window.postMessage` com tipos `LOG_MESSAGE` e `UPDATE_STATUS`.
- Entre contextos: `chrome.runtime.sendMessage({ action, ...payload })` e `chrome.runtime.onMessage.addListener` com `return true` síncrono quando for enviar a resposta depois.

### Convenções de Código
- Função de log padrão: `logToSystem(message, level = 'INFO', source = 'CORE')`.
- Nomes descritivos por responsabilidade (ex.: `asset-manager.js`, `payout-controller.js`).
- Evitar `console.log` na UI; preferir o sistema de logs.
- CSP: scripts sempre em arquivos; não usar scripts inline nos HTML do layout.

### Roadmap de Entregas
1) `payout-controller.js`:
   - `getCurrentPayout()` (captura robusta no DOM com fallback e logs)
   - `checkPayoutBeforeAnalysis()` com políticas `wait` e `switch`
2) `asset-manager.js`:
   - `listAssets()` | `switchTo(asset)` | `switchToBest(minPayout)`
   - Integração com o payout-controller para decisão de troca
3) Painel Dev (index.html + index.js):
   - Botões: dimensão do gráfico, crop do gráfico, teste de payout, listar/trocar ativo
   - Exibir status/logs de cada ação
4) `modal-analyze.js` (mock): abrir/fechar/toggle; WAIT/EXECUTE
5) `analysis-orchestrator.js` (mínimo): captura -> análise mock -> modal -> ação
6) `gale-system.js` (básico): estado, aplicar, reset e status integrados ao `StateManager`

### Checklist / Definition of Done (Core)
- [x] Extensão carrega sem erros (MV3)
- [x] Iframe injeta e toggle funciona (Ctrl+Shift+Y)
- [x] `sendStatus` atualiza a área de status
- [x] Captura de tela retorna `dataUrl` válida
- [ ] Payout capturado ou fallback informado com log
- [ ] Listagem e troca de ativo via Painel Dev
- [ ] Settings salva/carrega configurações (storage.sync)
- [ ] Logs visíveis em `logs.html`

### Observações Técnicas
- Clipboard (se necessário): usar documento offscreen com `document.execCommand('copy')` (confiável no MV3).
- Seletores do DOM: encapsular no payout/asset para facilitar manutenção.

### Próximas Ações Imediatas
1) Implementar `src/content/payout-controller.js` e expor mensagens: `GET_CURRENT_PAYOUT`.
2) Implementar `src/content/asset-manager.js` e expor mensagens: `LIST_ASSETS`, `SWITCH_ASSET`, `SWITCH_BEST_ASSET`.
3) Adicionar botões e binds no Painel Dev para acionar as funções acima.

