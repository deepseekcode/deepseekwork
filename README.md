# DeepSeekCode

[English](README.md) · [简体中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md)

**A local-first AI coding agent: one local runtime, driven by any OpenAI-compatible model.**

DeepSeekCode runs on your own machine and exposes the same agent core through several surfaces — an interactive terminal UI, a web workspace at `http://localhost:8080`, an HTTP/WebSocket API, and a JSONL batch mode for CI. Every tool call passes through a permission layer you control, and the UI is localized in 12 languages.

This repository is the **public distribution point**: the download page (GitHub Pages) plus the desktop installers. The source repository is private.

| | |
| --- | --- |
| Download page | <https://deepseekcode.github.io/deepseekwork/> |
| Installers (Releases) | <https://github.com/deepseekcode/deepseekwork/releases> |
| npm package | <https://www.npmjs.com/package/@deepseekcode/cli> |
| Machine-readable summary | <https://deepseekcode.github.io/deepseekwork/llms.txt> |

![DeepSeekCode terminal UI](website/assets/screenshots/cli.png)

## Highlights

- **One runtime, several surfaces** — terminal TUI, web UI, HTTP + WebSocket API, and `dscode exec` JSONL for scripts and CI. No separate backend to install.
- **A permission layer on every tool call** — scopes `system > project > user > local > session` (narrowest wins), `auto` / `ask` / `deny` policies, an optional AI classifier for the grey zone, and timeout-means-deny.
- **A strictly read-only plan mode** — `/plan` produces a checklist; nothing executes until you approve it, and the running loop picks the checklist up rather than switching engines.
- **Runtime-switchable modes** — `act`, `auto-act`, `goal`, `auto-goal`, `chat` (`Shift+Tab` cycles).
- **Roughly 70 built-in tools** — files, search, git, LSP, code intelligence, browser, sub-agents, plans, memory, MCP.
- **Sandboxed shell tools** — bwrap on Linux, SBPL on macOS, MXC / Docker on Windows; it refuses to run rather than fall back to an unsandboxed host shell.
- **Extensible** — MCP servers, skills, plugins, sub-agents, background work, workflows, and IM channels (LINE, Slack, WhatsApp, QQ, DingTalk, Feishu) with inbound request-signature verification.
- **Durable** — memory that survives across sessions, plus an optional watchdog that can resume a run that failed for a reason other than an explicit user stop.
- **Themes** — dark, light, nord, dracula, monokai, one-dark, tokyo-night.

![DeepSeekCode web workspace](website/assets/screenshots/tools.png)

## Install

### npm (Node.js >= 18)

```bash
npm install -g @deepseekcode/cli
dscode
```

Two commands are installed: `dscode` and `deepseekcode`.

### Desktop installers

| Platform | Formats |
| --- | --- |
| Windows x64 | `.exe` (NSIS), `.msi` |
| macOS (Apple Silicon + Intel) | universal `.dmg` |
| Linux x64 | `.deb`, `.rpm`, `.AppImage` |

Download them from [Releases](https://github.com/deepseekcode/deepseekwork/releases). Every asset ships with a matching `.sig` signature file.

## First run

1. Run `dscode` — it starts the agent core and the HTTP/WebSocket server in one process.
2. Open `http://localhost:8080/#models` and configure an OpenAI-compatible endpoint. Any server speaking that API works, including one running on `localhost`.
3. Back in the terminal, describe the task. Anything that writes files or runs commands goes through the permission layer.

## Scripts and CI

```bash
dscode exec "fix the failing test in src/utils"   # one task, JSONL output
dscode exec --file ./task.txt --text              # task from a file, plain-text output
```

`exec` emits one JSON object per line so results can be consumed programmatically; a non-TTY stdin also selects non-interactive mode.

## What is in this repository

| Path | Contents |
| --- | --- |
| `website/` | the download page — a single static `index.html`, mirrored from the source repository |
| `website/llms.txt` | machine-readable project summary for AI crawlers (llmstxt.org convention) |
| `website/zh/ ja/ ko/ es/ fr/` | per-language pages — **generated, do not edit by hand** |
| `website/tools/gen-locales.mjs` | the locale-page generator |
| `website/sitemap.xml`, `website/robots.txt` | crawl metadata |
| `.github/workflows/pages-deploy.yml` | deploys `website/` to GitHub Pages on push |
| `.github/workflows/release-stats.yml` | daily download-count snapshot committed to `.gh-stats/downloads.csv` |
| `scripts/gh-download-stats.ps1` | take a snapshot or report recent deltas (`-Report 7`) |
| `docs/` | i18n design notes and UI screenshot material |
| `_promo/` | promo asset recording toolchain |

## How this repository is maintained

**Shipping a new version — no code change needed**

1. Tag `desktop-v*` in the source repository; its `desktop-release` workflow builds the three platform installer sets and uploads them to this repository's Releases.
2. On load, the page queries GitHub `/releases/latest` for the newest `desktop-v*` tag — version badge, download links and the Release link all follow automatically.

`CONFIG.version` and `CONFIG.cliVersion` are only fallbacks, used when the GitHub API is rate-limited or the network is down.

**Changing the page itself (copy, layout, structure)**

1. Edit `website/index.html` in the source repository. Copy lives in the `EN` / `OV` dictionaries — the 58 static strings on the page are a pre-rendered snapshot that `render()` overwrites in the browser from the same dictionary, so the two never drift apart.
2. Regenerate the locale pages: `node website/tools/gen-locales.mjs` (reuses the same i18n dictionary; untranslated keys fall back to English).
3. Sync `website/` here and push → GitHub Pages updates automatically.

**Download stats** — GitHub only exposes a cumulative `download_count` per asset, so `release-stats.yml` records the cumulative value once a day into `.gh-stats/downloads.csv`; "new downloads in the last N days" is computed from that series with `powershell -File scripts\gh-download-stats.ps1 -Report 7`.

**One-time GitHub Pages setup** — Settings → Pages → Source: **GitHub Actions**. The workflow deploys the site; no branch or folder needs to be selected.

## Languages

The product UI ships in 12 languages; the download page publishes 6, each with its own static URL so a crawler that does not execute JavaScript still reads that language:

| Language | URL |
| --- | --- |
| English (default) | <https://deepseekcode.github.io/deepseekwork/> |
| 简体中文 | <https://deepseekcode.github.io/deepseekwork/zh/> |
| 日本語 | <https://deepseekcode.github.io/deepseekwork/ja/> |
| 한국어 | <https://deepseekcode.github.io/deepseekwork/ko/> |
| Español | <https://deepseekcode.github.io/deepseekwork/es/> |
| Français | <https://deepseekcode.github.io/deepseekwork/fr/> |

## License

Proprietary and closed source — **not** open source. Copying, modifying, distributing, sublicensing or selling requires prior written permission from the copyright holder. © 2026 DeepSeekCode. All rights reserved.

DeepSeekCode is an independent project. It is not affiliated with, sponsored by or endorsed by DeepSeek (深度求索) or any other model or tool vendor. The name refers to a client runtime, not to a model family, and the product ships no model of its own — it drives whichever OpenAI-compatible endpoint you configure.
