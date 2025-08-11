# Trade Manager Core

Core enxuto da extensão (MV3) com UI via iframe, logging/status, settings e painel de desenvolvimento.

## Como carregar
1. Chrome > Extensões > Modo do desenvolvedor
2. Carregar sem compactação e selecione esta pasta

## Estrutura
- UI em src/layout/*.html (carregada em iframe)
- Content script src/content/content.js injeta o iframe e faz a ponte com Background
- Background src/background/background.js coordena captura/ações
- Módulos reutilizáveis acessíveis via web_accessible_resources
