# DeepSeekCode

[English](README.md) · [简体中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [Italiano](README.it.md) · [العربية](README.ar.md) · [Bahasa Indonesia](README.id.md)

**Um agente de código com IA que roda em local: um único runtime na sua máquina, movido por qualquer modelo compatível com OpenAI.**

O DeepSeekCode roda na sua própria máquina e expõe o mesmo núcleo do agente por várias superfícies: uma interface de terminal interativa, um espaço de trabalho web em `http://localhost:8080`, uma API HTTP/WebSocket e um modo em lote com JSONL para CI. Toda chamada de ferramenta passa por uma camada de permissões que você controla, e a interface está traduzida para 12 idiomas.

Este repositório é o **ponto de distribuição público**: a página de download (GitHub Pages) e os instaladores de desktop. O repositório de código-fonte é privado.

| | |
| --- | --- |
| Página de download | <https://deepseekcode.github.io/deepseekwork/> |
| Instaladores (Releases) | <https://github.com/deepseekcode/deepseekwork/releases> |
| Pacote npm | <https://www.npmjs.com/package/@deepseekcode/cli> |
| Resumo legível por máquina | <https://deepseekcode.github.io/deepseekwork/llms.txt> |

![Interface de terminal do DeepSeekCode](website/assets/screenshots/cli.png)

## Destaques

- **Um runtime, várias superfícies** — TUI de terminal, interface web, API HTTP + WebSocket e `dscode exec` em JSONL para scripts e CI. Nenhum backend separado para instalar.
- **Camada de permissões em cada chamada de ferramenta** — escopos `system > project > user > local > session` (o mais restrito vence), políticas `auto` / `ask` / `deny`, um classificador de IA opcional para a zona cinzenta, e tempo esgotado significa negação.
- **Modo de plano estritamente somente leitura** — `/plan` gera uma lista de verificação; nada é executado até você aprová-la, e o laço em execução assume essa lista em vez de trocar de motor.
- **Modos alternáveis em tempo de execução** — `act`, `auto-act`, `goal`, `auto-goal`, `chat` (`Shift+Tab` alterna entre eles).
- **Cerca de 70 ferramentas integradas** — arquivos, busca, git, LSP, inteligência de código, navegador, subagentes, planos, memória, MCP.
- **Ferramentas de shell em sandbox** — bwrap no Linux, SBPL no macOS, MXC / Docker no Windows; sem uma política disponível, ele se recusa a executar em vez de cair para um shell do host sem sandbox.
- **Extensível** — servidores MCP, skills, plugins, subagentes, trabalho em segundo plano, workflows e canais de mensagem (LINE, Slack, WhatsApp, QQ, DingTalk, Feishu) com verificação de assinatura nas requisições recebidas.
- **Durável** — memória que sobrevive entre sessões, além de um watchdog opcional capaz de retomar uma execução interrompida por motivo diferente de uma parada explícita do usuário.
- **Temas** — dark, light, nord, dracula, monokai, one-dark, tokyo-night.

![Espaço de trabalho web do DeepSeekCode](website/assets/screenshots/tools.png)

## Instalação

### npm (Node.js >= 18)

```bash
npm install -g @deepseekcode/cli
dscode
```

Dois comandos são instalados: `dscode` e `deepseekcode`.

### Instaladores de desktop

| Plataforma | Formatos |
| --- | --- |
| Windows x64 | `.exe` (NSIS), `.msi` |
| macOS (Apple Silicon + Intel) | `.dmg` universal |
| Linux x64 | `.deb`, `.rpm`, `.AppImage` |

Baixe em [Releases](https://github.com/deepseekcode/deepseekwork/releases). Cada arquivo vem com um `.sig` de assinatura de mesmo nome.

## Primeira execução

1. Execute `dscode` — ele inicia o núcleo do agente e o servidor HTTP/WebSocket no mesmo processo.
2. Abra `http://localhost:8080/#models` e configure um endpoint compatível com OpenAI. Qualquer servidor que fale essa API serve, inclusive um rodando em `localhost`.
3. De volta ao terminal, descreva a tarefa. Tudo o que grava arquivos ou executa comandos passa pela camada de permissões.

## Scripts e CI

```bash
dscode exec "fix the failing test in src/utils"   # uma tarefa, saída em JSONL
dscode exec --file ./task.txt --text              # tarefa lida de arquivo, saída em texto puro
```

O `exec` emite um objeto JSON por linha, então o resultado pode ser consumido por programa; stdin que não é um TTY também seleciona o modo não interativo.

## O que há neste repositório

| Caminho | Conteúdo |
| --- | --- |
| `website/` | a página de download — um único `index.html` estático, espelhado do repositório de código-fonte |
| `website/llms.txt` | resumo legível por máquina para rastreadores de IA (convenção llmstxt.org) |
| `website/zh/ ja/ ko/ es/ fr/` | páginas por idioma — **geradas, não editar à mão** |
| `website/tools/gen-locales.mjs` | o gerador das páginas por idioma |
| `website/sitemap.xml`, `website/robots.txt` | metadados de rastreamento |
| `.github/workflows/pages-deploy.yml` | publica `website/` no GitHub Pages a cada push |
| `.github/workflows/release-stats.yml` | snapshot diário de downloads, gravado em `.gh-stats/downloads.csv` |
| `scripts/gh-download-stats.ps1` | tirar o snapshot ou relatar as variações recentes (`-Report 7`) |
| `docs/` | notas de design de i18n e material de capturas de tela |
| `_promo/` | cadeia de ferramentas para gravar material promocional |

## Como este repositório é mantido

**Publicar uma versão nova — sem mexer em código**

1. Crie uma tag `desktop-v*` no repositório de código-fonte; o workflow `desktop-release` dele compila os instaladores das três plataformas e os envia para as Releases deste repositório.
2. Ao carregar, a página consulta `/releases/latest` do GitHub para pegar a tag `desktop-v*` mais recente — o selo de versão, os links de download e o link da Release acompanham automaticamente.

`CONFIG.version` e `CONFIG.cliVersion` são apenas valores de reserva, usados quando a API do GitHub limita as requisições ou a rede cai.

**Alterar a própria página (textos, layout, estrutura)**

1. Edite `website/index.html` no repositório de código-fonte. Os textos ficam nos dicionários `EN` / `OV`: as 58 strings estáticas da página são um snapshot pré-renderizado que `render()` sobrescreve no navegador a partir do mesmo dicionário, então os dois lados nunca divergem.
2. Se mudou textos, regenere as páginas por idioma: `node website/tools/gen-locales.mjs` (reutiliza o mesmo dicionário i18n; chaves não traduzidas caem para o inglês).
3. Sincronize `website/` aqui e faça push → o GitHub Pages se atualiza sozinho.

**Estatísticas de download** — o GitHub só expõe um `download_count` acumulado por arquivo, então `release-stats.yml` grava esse valor acumulado uma vez por dia em `.gh-stats/downloads.csv`; os "novos downloads nos últimos N dias" saem dessa série com `powershell -File scripts\gh-download-stats.ps1 -Report 7`.

**Configuração inicial do GitHub Pages** — Settings → Pages → Source: **GitHub Actions**. O workflow publica o site; não é preciso escolher branch nem pasta.

## Idiomas

A interface do produto sai em 12 idiomas; a página de download publica 6, cada uma com URL estática própria, para que um rastreador que não executa JavaScript leia o conteúdo naquele idioma:

| Idioma | URL |
| --- | --- |
| English (padrão) | <https://deepseekcode.github.io/deepseekwork/> |
| 简体中文 | <https://deepseekcode.github.io/deepseekwork/zh/> |
| 日本語 | <https://deepseekcode.github.io/deepseekwork/ja/> |
| 한국어 | <https://deepseekcode.github.io/deepseekwork/ko/> |
| Español | <https://deepseekcode.github.io/deepseekwork/es/> |
| Français | <https://deepseekcode.github.io/deepseekwork/fr/> |

## Licença

Software proprietário e de código fechado — **não** é código aberto. Copiar, modificar, distribuir, sublicenciar ou vender exige autorização prévia por escrito do detentor dos direitos. © 2026 DeepSeekCode. Todos os direitos reservados.

O DeepSeekCode é um projeto independente. Não é afiliado, patrocinado nem endossado pela DeepSeek (深度求索) ou por qualquer outro fornecedor de modelos ou ferramentas. O nome designa um runtime cliente, não uma família de modelos, e o produto não traz modelo próprio: apenas aciona o endpoint compatível com OpenAI que você configurar.
