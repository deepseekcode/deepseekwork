# DeepSeekCode

[English](README.md) · [简体中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [Italiano](README.it.md) · [العربية](README.ar.md) · [Bahasa Indonesia](README.id.md)

**Un agente di coding con IA che gira in locale: un'unica runtime sulla tua macchina, mossa da qualsiasi modello compatibile con OpenAI.**

DeepSeekCode gira sulla tua macchina ed espone lo stesso nucleo dell'agente attraverso più superfici: un'interfaccia di terminale interattiva, uno spazio di lavoro web su `http://localhost:8080`, un'API HTTP/WebSocket e una modalità batch JSONL per la CI. Ogni chiamata a uno strumento passa da uno strato di permessi che controlli tu, e l'interfaccia è tradotta in 12 lingue.

Questo repository è il **punto di distribuzione pubblico**: la pagina di download (GitHub Pages) e gli installer desktop. Il repository del codice sorgente è privato.

| | |
| --- | --- |
| Pagina di download | <https://deepseekcode.github.io/deepseekwork/> |
| Installer (Releases) | <https://github.com/deepseekcode/deepseekwork/releases> |
| Pacchetto npm | <https://www.npmjs.com/package/@deepseekcode/cli> |
| Riepilogo leggibile da macchina | <https://deepseekcode.github.io/deepseekwork/llms.txt> |

![Interfaccia di terminale di DeepSeekCode](website/assets/screenshots/cli.png)

## Caratteristiche

- **Una runtime, più superfici** — TUI da terminale, interfaccia web, API HTTP + WebSocket e `dscode exec` in JSONL per script e CI. Nessun backend separato da installare.
- **Strato di permessi su ogni chiamata a uno strumento** — ambiti `system > project > user > local > session` (vince il più ristretto), politiche `auto` / `ask` / `deny`, un classificatore IA opzionale per la zona grigia, e timeout significa rifiuto.
- **Modalità piano rigorosamente in sola lettura** — `/plan` produce una checklist; nulla viene eseguito finché non la approvi, e il ciclo in esecuzione riprende quella checklist invece di cambiare motore.
- **Modalità commutabili a runtime** — `act`, `auto-act`, `goal`, `auto-goal`, `chat` (`Shift+Tab` le alterna).
- **Circa 70 strumenti integrati** — file, ricerca, git, LSP, intelligenza sul codice, browser, subagenti, piani, memoria, MCP.
- **Strumenti di shell in sandbox** — bwrap su Linux, SBPL su macOS, MXC / Docker su Windows; se manca una politica disponibile si rifiuta di eseguire invece di ripiegare su una shell dell'host senza sandbox.
- **Estendibile** — server MCP, skill, plugin, subagenti, lavoro in background, workflow e canali di messaggistica (LINE, Slack, WhatsApp, QQ, DingTalk, Feishu) con verifica della firma sulle richieste in ingresso.
- **Durevole** — una memoria che sopravvive tra le sessioni, più un watchdog opzionale capace di riprendere un'esecuzione interrotta per un motivo diverso da un arresto esplicito dell'utente.
- **Temi** — dark, light, nord, dracula, monokai, one-dark, tokyo-night.

![Spazio di lavoro web di DeepSeekCode](website/assets/screenshots/tools.png)

## Installazione

### npm (Node.js >= 18)

```bash
npm install -g @deepseekcode/cli
dscode
```

Vengono installati due comandi: `dscode` e `deepseekcode`.

### Installer desktop

| Piattaforma | Formati |
| --- | --- |
| Windows x64 | `.exe` (NSIS), `.msi` |
| macOS (Apple Silicon + Intel) | `.dmg` universale |
| Linux x64 | `.deb`, `.rpm`, `.AppImage` |

Li trovi nelle [Releases](https://github.com/deepseekcode/deepseekwork/releases). Ogni file ha la sua firma `.sig` con lo stesso nome.

## Primo avvio

1. Esegui `dscode`: avvia il nucleo dell'agente e il server HTTP/WebSocket nello stesso processo.
2. Apri `http://localhost:8080/#models` e configura un endpoint compatibile con OpenAI. Va bene qualsiasi server che parli quell'API, compreso uno in ascolto su `localhost`.
3. Torna al terminale e descrivi l'attività. Tutto ciò che scrive file o esegue comandi passa dallo strato di permessi.

## Script e CI

```bash
dscode exec "fix the failing test in src/utils"   # una sola attività, output JSONL
dscode exec --file ./task.txt --text              # attività da file, output in testo semplice
```

`exec` emette un oggetto JSON per riga, così il risultato è consumabile da un programma; anche uno stdin che non è una TTY seleziona la modalità non interattiva.

## Cosa contiene questo repository

| Percorso | Contenuto |
| --- | --- |
| `website/` | la pagina di download: un unico `index.html` statico, sincronizzato dal repository sorgente |
| `website/llms.txt` | riepilogo leggibile da macchina per i crawler IA (convenzione llmstxt.org) |
| `website/zh/ ja/ ko/ es/ fr/` | pagine per lingua — **generate, non modificare a mano** |
| `website/tools/gen-locales.mjs` | il generatore delle pagine per lingua |
| `website/sitemap.xml`, `website/robots.txt` | metadati per la scansione |
| `.github/workflows/pages-deploy.yml` | pubblica `website/` su GitHub Pages a ogni push |
| `.github/workflows/release-stats.yml` | istantanea giornaliera dei download, salvata in `.gh-stats/downloads.csv` |
| `scripts/gh-download-stats.ps1` | scattare l'istantanea o riportare le variazioni recenti (`-Report 7`) |
| `docs/` | note di progetto sull'i18n e materiale per gli screenshot |
| `_promo/` | catena di strumenti per registrare il materiale promozionale |

## Come viene mantenuto questo repository

**Pubblicare una nuova versione — nessuna modifica al codice**

1. Crea un tag `desktop-v*` nel repository sorgente: il suo workflow `desktop-release` compila gli installer per le tre piattaforme e li carica nelle Releases di questo repository.
2. Al caricamento la pagina interroga `/releases/latest` di GitHub per il tag `desktop-v*` più recente: badge di versione, link di download e link alla Release si aggiornano da soli.

`CONFIG.version` e `CONFIG.cliVersion` sono solo valori di ripiego, usati quando l'API di GitHub limita le richieste o manca la rete.

**Modificare la pagina stessa (testi, layout, struttura)**

1. Modifica `website/index.html` nel repository sorgente. I testi stanno nei dizionari `EN` / `OV`: le 58 stringhe statiche della pagina sono un'istantanea pre-renderizzata che `render()` sovrascrive nel browser dallo stesso dizionario, così le due parti non divergono mai.
2. Se hai cambiato i testi, rigenera le pagine per lingua: `node website/tools/gen-locales.mjs` (riusa lo stesso dizionario i18n; le chiavi non tradotte ricadono sull'inglese).
3. Sincronizza `website/` qui e fai push → GitHub Pages si aggiorna da solo.

**Statistiche dei download** — GitHub espone solo un `download_count` cumulativo per file, quindi `release-stats.yml` registra quel valore cumulato una volta al giorno in `.gh-stats/downloads.csv`; i "nuovi download negli ultimi N giorni" si ricavano da quella serie con `powershell -File scripts\gh-download-stats.ps1 -Report 7`.

**Configurazione iniziale di GitHub Pages** — Settings → Pages → Source: **GitHub Actions**. Il deploy lo fa il workflow; non serve scegliere branch o cartella.

## Lingue

L'interfaccia del prodotto è disponibile in 12 lingue; la pagina di download ne pubblica 6, ognuna con un URL statico proprio, così un crawler che non esegue JavaScript legge comunque i contenuti in quella lingua:

| Lingua | URL |
| --- | --- |
| English (predefinito) | <https://deepseekcode.github.io/deepseekwork/> |
| 简体中文 | <https://deepseekcode.github.io/deepseekwork/zh/> |
| 日本語 | <https://deepseekcode.github.io/deepseekwork/ja/> |
| 한국어 | <https://deepseekcode.github.io/deepseekwork/ko/> |
| Español | <https://deepseekcode.github.io/deepseekwork/es/> |
| Français | <https://deepseekcode.github.io/deepseekwork/fr/> |

## Licenza

Software proprietario e a codice chiuso: **non** è open source. Copiare, modificare, distribuire, sublicenziare o vendere richiede il preventivo consenso scritto del titolare dei diritti. © 2026 DeepSeekCode. Tutti i diritti riservati.

DeepSeekCode è un progetto indipendente. Non è affiliato, sponsorizzato né approvato da DeepSeek (深度求索) o da qualsiasi altro fornitore di modelli o strumenti. Il nome indica una runtime client, non una famiglia di modelli: il prodotto non include alcun modello proprio e si limita a pilotare l'endpoint compatibile con OpenAI che configuri.
