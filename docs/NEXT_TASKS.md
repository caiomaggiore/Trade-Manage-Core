# To-Do – Próximas Tarefas

## Prioridade Alta ✅ CONCLUÍDO
- [x] Implementar `src/content/payout-controller.js` com:
  - [x] `getCurrentPayout()` (captura robusta do DOM, fallback e logs)
  - [x] `checkPayoutBeforeAnalysis()` com políticas `wait` e `switch`
- [x] Implementar `src/content/asset-manager.js` com APIs:
  - [x] `listAssets()` | `switchTo(asset)` | `switchToBest(minPayout)`
  - [x] Integrar com payout-controller para decisão de troca
- [x] Expandir Painel Dev em `src/layout/index.html` + binds em `src/content/index.js`:
  - [x] Botões: dimensão do gráfico, crop do gráfico, teste de payout, listar/trocar ativo
  - [x] Exibir status/logs das ações no painel

## Mensageria (actions) ✅ CONCLUÍDO
- [x] Definir/implementar actions no Background/Content:
  - [x] `CAPTURE_SCREENSHOT` (já pronto)
  - [x] `GET_CURRENT_PAYOUT`
  - [x] `LIST_ASSETS`, `SWITCH_ASSET`, `SWITCH_BEST_ASSET`
  - [x] Garantir `return true` síncrono para respostas assíncronas

## UI/UX ✅ CONCLUÍDO
- [x] Melhorar estilos base em `src/assets/styles/style.css` (layout, botões, status)
- [x] Links/botões para abrir `settings.html` e `logs.html` em subpágina/modal

## Próximas (fase 2)
- [ ] `modal-analyze.js` (mock: abrir/fechar/toggle; WAIT/EXECUTE)
- [ ] `analysis-orchestrator.js` (pipeline mínimo: captura -> análise mock -> modal -> ação)
- [ ] `gale-system.js` (estado, aplicar, reset, status) integrado ao `StateManager`

## Definition of Done (Core) ✅ IMPLEMENTADO
- [x] Extensão carrega sem erros no Chrome (MV3)
- [x] Iframe injeta/toggle funciona (Ctrl+Shift+Y)
- [x] `sendStatus` atualiza a área de status
- [x] Captura de tela retorna `dataUrl` válida
- [x] Payout capturado ou fallback informado com log
- [x] Listagem e troca de ativo via Painel Dev funcionando
- [x] Settings salva/carrega configurações (storage.sync)
- [x] Logs visíveis em `logs.html`

## 🎯 Implementações Baseadas no Projeto Original ✅ CONCLUÍDO
### Funcionalidades DOM Específicas da Pocket Option
- [x] Controle real do modal de ativos (abrir/fechar/toggle)
- [x] Seletores específicos para detecção de payout baseados no projeto original
- [x] Detecção real das dimensões do gráfico com canvas
- [x] Crop funcional do gráfico com captura de tela
- [x] Sistema de logs integrado com as operações DOM
- [x] Fallbacks robustos quando elementos não são encontrados

### Arquivo Principal: `src/content/pocket-option-dom.js`
- Baseado nos seletores e métodos do `content.js` original
- Implementa funcionalidades específicas da Pocket Option
- Compatível com a arquitetura MV3 do Core

## 🎯 Próximos Objetivos (Fase 2)
### Funcionalidades Avançadas
- [ ] Sistema de análise com modal (WAIT/EXECUTE)
- [ ] Orquestrador de análise (pipeline completo)
- [ ] Sistema Gale integrado ao StateManager
- [ ] Automação de trades baseada na análise
- [ ] Integração com IA (Gemini API)

