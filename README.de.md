# DeepSeekCode

[English](README.md) · [简体中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [Italiano](README.it.md) · [العربية](README.ar.md) · [Bahasa Indonesia](README.id.md)

**Ein KI-Coding-Agent, der lokal läuft: eine lokale Runtime, angetrieben von jedem OpenAI-kompatiblen Modell.**

DeepSeekCode läuft auf der eigenen Maschine und stellt denselben Agent-Kern über mehrere Oberflächen bereit: eine interaktive Terminal-Oberfläche, einen Web-Arbeitsbereich unter `http://localhost:8080`, eine HTTP/WebSocket-API und einen JSONL-Batchmodus für CI. Jeder Tool-Aufruf durchläuft eine Berechtigungsschicht, die du kontrollierst, und die Oberfläche ist in 12 Sprachen übersetzt.

Dieses Repository ist der **öffentliche Vertriebspunkt**: die Download-Seite (GitHub Pages) und die Desktop-Installer. Das Quell-Repository ist privat.

| | |
| --- | --- |
| Download-Seite | <https://deepseekcode.github.io/deepseekwork/> |
| Installer (Releases) | <https://github.com/deepseekcode/deepseekwork/releases> |
| npm-Paket | <https://www.npmjs.com/package/@deepseekcode/cli> |
| Maschinenlesbare Kurzfassung | <https://deepseekcode.github.io/deepseekwork/llms.txt> |

![DeepSeekCode Terminal-Oberfläche](website/assets/screenshots/cli.png)

## Hauptmerkmale

- **Eine Runtime, mehrere Oberflächen** — Terminal-TUI, Web-UI, HTTP- + WebSocket-API und `dscode exec` als JSONL für Skripte und CI. Kein separates Backend zu installieren.
- **Eine Berechtigungsschicht bei jedem Tool-Aufruf** — Geltungsbereiche `system > project > user > local > session` (der engste gewinnt), Richtlinien `auto` / `ask` / `deny`, ein optionaler KI-Klassifikator für die Grauzone, und Zeitüberschreitung bedeutet Ablehnung.
- **Ein streng schreibgeschützter Plan-Modus** — `/plan` erzeugt eine Checkliste; nichts wird ausgeführt, bevor du sie freigibst, und die laufende Schleife übernimmt diese Checkliste, statt die Engine zu wechseln.
- **Zur Laufzeit umschaltbare Modi** — `act`, `auto-act`, `goal`, `auto-goal`, `chat` (`Shift+Tab` schaltet durch).
- **Rund 70 eingebaute Tools** — Dateien, Suche, git, LSP, Code-Intelligence, Browser, Subagenten, Pläne, Speicher, MCP.
- **Shell-Tools in der Sandbox** — bwrap unter Linux, SBPL unter macOS, MXC / Docker unter Windows; fehlt eine passende Richtlinie, verweigert es die Ausführung, statt auf eine ungesandboxte Host-Shell zurückzufallen.
- **Erweiterbar** — MCP-Server, Skills, Plugins, Subagenten, Hintergrundarbeit, Workflows und IM-Kanäle (LINE, Slack, WhatsApp, QQ, DingTalk, Feishu) mit Signaturprüfung eingehender Anfragen.
- **Dauerhaft** — ein Gedächtnis, das Sitzungen überdauert, plus ein optionaler Watchdog, der einen Lauf fortsetzt, der aus einem anderen Grund als einem ausdrücklichen Stopp abgebrochen wurde.
- **Themes** — dark, light, nord, dracula, monokai, one-dark, tokyo-night.

![DeepSeekCode Web-Arbeitsbereich](website/assets/screenshots/tools.png)

## Installation

### npm (Node.js >= 18)

```bash
npm install -g @deepseekcode/cli
dscode
```

Es werden zwei Befehle installiert: `dscode` und `deepseekcode`.

### Desktop-Installer

| Plattform | Formate |
| --- | --- |
| Windows x64 | `.exe` (NSIS), `.msi` |
| macOS (Apple Silicon + Intel) | universelles `.dmg` |
| Linux x64 | `.deb`, `.rpm`, `.AppImage` |

Zu finden in den [Releases](https://github.com/deepseekcode/deepseekwork/releases). Jedes Asset hat eine gleichnamige `.sig`-Signaturdatei.

## Erster Start

1. `dscode` ausführen — Agent-Kern und HTTP/WebSocket-Server starten im selben Prozess.
2. `http://localhost:8080/#models` öffnen und einen OpenAI-kompatiblen Endpoint konfigurieren. Jeder Server, der diese API spricht, funktioniert — auch einer auf `localhost`.
3. Zurück im Terminal die Aufgabe beschreiben. Alles, was Dateien schreibt oder Befehle ausführt, geht durch die Berechtigungsschicht.

## Skripte und CI

```bash
dscode exec "fix the failing test in src/utils"   # eine Aufgabe, JSONL-Ausgabe
dscode exec --file ./task.txt --text              # Aufgabe aus Datei, Klartext-Ausgabe
```

`exec` gibt pro Zeile ein JSON-Objekt aus, sodass das Ergebnis programmatisch weiterverarbeitet werden kann; ein stdin, das kein TTY ist, wählt ebenfalls den nicht-interaktiven Modus.

## Was in diesem Repository liegt

| Pfad | Inhalt |
| --- | --- |
| `website/` | die Download-Seite — eine einzelne statische `index.html`, aus dem Quell-Repository gespiegelt |
| `website/llms.txt` | maschinenlesbare Projekt-Kurzfassung für KI-Crawler (llmstxt.org-Konvention) |
| `website/zh/ ja/ ko/ es/ fr/` | Seiten je Sprache — **generiert, nicht von Hand bearbeiten** |
| `website/tools/gen-locales.mjs` | der Generator für die Sprachseiten |
| `website/sitemap.xml`, `website/robots.txt` | Crawl-Metadaten |
| `.github/workflows/pages-deploy.yml` | deployt `website/` bei jedem Push auf GitHub Pages |
| `.github/workflows/release-stats.yml` | täglicher Download-Snapshot, committet nach `.gh-stats/downloads.csv` |
| `scripts/gh-download-stats.ps1` | Snapshot aufnehmen oder aktuelle Zuwächse melden (`-Report 7`) |
| `docs/` | i18n-Designnotizen und Screenshot-Material |
| `_promo/` | Toolchain zum Aufnehmen von Promo-Material |

## Wie dieses Repository gepflegt wird

**Eine neue Version ausliefern — ohne Codeänderung**

1. Im Quell-Repository ein Tag `desktop-v*` setzen; dessen `desktop-release`-Workflow baut die Installer für alle drei Plattformen und lädt sie in die Releases dieses Repositories.
2. Beim Laden fragt die Seite GitHub unter `/releases/latest` nach dem neuesten `desktop-v*`-Tag — Versions-Badge, Download-Links und der Release-Link folgen automatisch.

`CONFIG.version` und `CONFIG.cliVersion` sind nur Rückfallwerte, die greifen, wenn die GitHub-API limitiert oder das Netz weg ist.

**Die Seite selbst ändern (Texte, Layout, Struktur)**

1. `website/index.html` im Quell-Repository bearbeiten. Die Texte liegen in den Dictionaries `EN` / `OV`: die 58 statischen Strings auf der Seite sind ein vorgerenderter Snapshot, den `render()` im Browser aus demselben Dictionary überschreibt, sodass beide Seiten nie auseinanderlaufen.
2. Nach Textänderungen die Sprachseiten neu erzeugen: `node website/tools/gen-locales.mjs` (nutzt dasselbe i18n-Dictionary; nicht übersetzte Schlüssel fallen auf Englisch zurück).
3. `website/` hierher synchronisieren und pushen → GitHub Pages aktualisiert sich automatisch.

**Download-Statistik** — GitHub liefert pro Asset nur einen kumulativen `download_count`; deshalb schreibt `release-stats.yml` diesen Wert einmal täglich nach `.gh-stats/downloads.csv`, und „neue Downloads der letzten N Tage" wird aus dieser Reihe berechnet: `powershell -File scripts\gh-download-stats.ps1 -Report 7`.

**Einmalige GitHub-Pages-Einrichtung** — Settings → Pages → Source: **GitHub Actions**. Der Workflow deployt die Seite; es muss kein Branch und kein Ordner ausgewählt werden.

## Sprachen

Die Produktoberfläche gibt es in 12 Sprachen; die Download-Seite veröffentlicht 6, jede mit eigener statischer URL, damit auch ein Crawler ohne JavaScript die Inhalte in dieser Sprache liest:

| Sprache | URL |
| --- | --- |
| English (Standard) | <https://deepseekcode.github.io/deepseekwork/> |
| 简体中文 | <https://deepseekcode.github.io/deepseekwork/zh/> |
| 日本語 | <https://deepseekcode.github.io/deepseekwork/ja/> |
| 한국어 | <https://deepseekcode.github.io/deepseekwork/ko/> |
| Español | <https://deepseekcode.github.io/deepseekwork/es/> |
| Français | <https://deepseekcode.github.io/deepseekwork/fr/> |

## Lizenz

Proprietäre Software mit geschlossenem Quellcode — **kein** Open Source. Vervielfältigen, Verändern, Verbreiten, Unterlizenzieren oder Verkaufen erfordert die vorherige schriftliche Erlaubnis des Rechteinhabers. © 2026 DeepSeekCode. Alle Rechte vorbehalten.

DeepSeekCode ist ein unabhängiges Projekt. Es ist weder mit DeepSeek (深度求索) noch mit einem anderen Modell- oder Tool-Anbieter verbunden, von ihnen gesponsert oder unterstützt. Der Name bezeichnet eine Client-Runtime, keine Modellfamilie; das Produkt bringt kein eigenes Modell mit und bedient ausschließlich den OpenAI-kompatiblen Endpoint, den du konfigurierst.
