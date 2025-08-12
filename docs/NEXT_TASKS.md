# To-Do – Próximas Tarefas

## Prioridade Alta
- [ ] Implementar `src/content/payout-controller.js` com:
  - [ ] `getCurrentPayout()` (captura robusta do DOM, fallback e logs)
  - [ ] `checkPayoutBeforeAnalysis()` com políticas `wait` e `switch`
- [ ] Implementar `src/content/asset-manager.js` com APIs:
  - [ ] `listAssets()` | `switchTo(asset)` | `switchToBest(minPayout)`
  - [ ] Integrar com payout-controller para decisão de troca
- [ ] Expandir Painel Dev em `src/layout/index.html` + binds em `src/content/index.js`:
  - [ ] Botões: dimensão do gráfico, crop do gráfico, teste de payout, listar/trocar ativo
  - [ ] Exibir status/logs das ações no painel

## Mensageria (actions)
- [ ] Definir/implementar actions no Background/Content:
  - [ ] `CAPTURE_SCREENSHOT` (já pronto)
  - [ ] `GET_CURRENT_PAYOUT`
  - [ ] `LIST_ASSETS`, `SWITCH_ASSET`, `SWITCH_BEST_ASSET`
  - [ ] Garantir `return true` síncrono para respostas assíncronas

## UI/UX
- [ ] Melhorar estilos base em `src/assets/styles/style.css` (layout, botões, status)
- [ ] Links/botões para abrir `settings.html` e `logs.html` em subpágina/modal

## Próximas (fase 2)
- [ ] `modal-analyze.js` (mock: abrir/fechar/toggle; WAIT/EXECUTE)
- [ ] `analysis-orchestrator.js` (pipeline mínimo: captura -> análise mock -> modal -> ação)
- [ ] `gale-system.js` (estado, aplicar, reset, status) integrado ao `StateManager`

## Definition of Done (Core)
- [ ] Extensão carrega sem erros no Chrome (MV3)
- [ ] Iframe injeta/toggle funciona (Ctrl+Shift+Y)
- [ ] `sendStatus` atualiza a área de status
- [ ] Captura de tela retorna `dataUrl` válida
- [ ] Payout capturado ou fallback informado com log
- [ ] Listagem e troca de ativo via Painel Dev funcionando
- [ ] Settings salva/carrega configurações (storage.sync)
- [ ] Logs visíveis em `logs.html`
