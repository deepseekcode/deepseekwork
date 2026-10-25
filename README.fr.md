# DeepSeekCode

[English](README.md) · [简体中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [Italiano](README.it.md) · [العربية](README.ar.md) · [Bahasa Indonesia](README.id.md)

**Un agent de codage IA local d'abord : un seul runtime local, propulsé par n'importe quel modèle compatible OpenAI.**

DeepSeekCode s'exécute sur votre propre machine et expose le même cœur d'agent via plusieurs surfaces : une interface de terminal interactive, un espace de travail web sur `http://localhost:8080`, une API HTTP/WebSocket et un mode par lots JSONL pour la CI. Chaque appel d'outil traverse une couche de permissions que vous contrôlez, et l'interface est traduite en 12 langues.

Ce dépôt est le **point de distribution public** : la page de téléchargement (GitHub Pages) et les installateurs de bureau. Le dépôt source est privé.

| | |
| --- | --- |
| Page de téléchargement | <https://deepseekcode.github.io/deepseekwork/> |
| Installateurs (Releases) | <https://github.com/deepseekcode/deepseekwork/releases> |
| Paquet npm | <https://www.npmjs.com/package/@deepseekcode/cli> |
| Résumé lisible par machine | <https://deepseekcode.github.io/deepseekwork/llms.txt> |

![Interface terminal de DeepSeekCode](website/assets/screenshots/cli.png)

## Points clés

- **Un runtime, plusieurs surfaces** — TUI de terminal, interface web, API HTTP + WebSocket et `dscode exec` en JSONL pour les scripts et la CI. Aucun backend séparé à installer.
- **Une couche de permissions sur chaque appel d'outil** — portées `system > project > user > local > session` (la plus étroite l'emporte), politiques `auto` / `ask` / `deny`, classifieur IA optionnel pour la zone grise, et délai dépassé vaut refus.
- **Un mode plan strictement en lecture seule** — `/plan` produit une liste de contrôle ; rien ne s'exécute avant votre approbation, et la boucle en cours reprend cette liste au lieu de changer de moteur.
- **Modes commutables à l'exécution** — `act`, `auto-act`, `goal`, `auto-goal`, `chat` (`Shift+Tab` fait défiler).
- **Environ 70 outils intégrés** — fichiers, recherche, git, LSP, intelligence de code, navigateur, sous-agents, plans, mémoire, MCP.
- **Shell en bac à sable** — bwrap sous Linux, SBPL sous macOS, MXC / Docker sous Windows ; faute de politique disponible, il refuse d'exécuter plutôt que de retomber sur un shell hôte non isolé.
- **Extensible** — serveurs MCP, skills, plugins, sous-agents, tâches d'arrière-plan, workflows et canaux de messagerie (LINE, Slack, WhatsApp, QQ, DingTalk, Feishu) avec vérification de signature des requêtes entrantes.
- **Durabilité** — une mémoire qui survit d'une session à l'autre, et un watchdog optionnel capable de reprendre une exécution interrompue pour une raison autre qu'un arrêt explicite de l'utilisateur.
- **Thèmes** — dark, light, nord, dracula, monokai, one-dark, tokyo-night.

![Espace de travail web de DeepSeekCode](website/assets/screenshots/tools.png)

## Installation

### npm (Node.js >= 18)

```bash
npm install -g @deepseekcode/cli
dscode
```

Deux commandes sont installées : `dscode` et `deepseekcode`.

### Installateurs de bureau

| Plateforme | Formats |
| --- | --- |
| Windows x64 | `.exe` (NSIS), `.msi` |
| macOS (Apple Silicon + Intel) | `.dmg` universel |
| Linux x64 | `.deb`, `.rpm`, `.AppImage` |

À récupérer dans les [Releases](https://github.com/deepseekcode/deepseekwork/releases). Chaque fichier est accompagné d'une signature `.sig` du même nom.

## Premier lancement

1. Lancez `dscode` : le cœur de l'agent et le serveur HTTP/WebSocket démarrent dans le même processus.
2. Ouvrez `http://localhost:8080/#models` et configurez un endpoint compatible OpenAI. Tout serveur parlant cette API convient, y compris un serveur local sur `localhost`.
3. Revenez au terminal et décrivez la tâche. Tout ce qui écrit des fichiers ou exécute des commandes passe par la couche de permissions.

## Scripts et CI

```bash
dscode exec "fix the failing test in src/utils"   # une tâche, sortie JSONL
dscode exec --file ./task.txt --text              # tâche lue depuis un fichier, sortie en texte brut
```

`exec` émet un objet JSON par ligne, donc le résultat se consomme directement par programme ; un stdin non-TTY sélectionne aussi le mode non interactif.

## Contenu de ce dépôt

| Chemin | Contenu |
| --- | --- |
| `website/` | la page de téléchargement : un unique `index.html` statique, synchronisé depuis le dépôt source |
| `website/llms.txt` | résumé lisible par machine pour les crawlers IA (convention llmstxt.org) |
| `website/zh/ ja/ ko/ es/ fr/` | pages par langue — **générées, ne pas modifier à la main** |
| `website/tools/gen-locales.mjs` | le générateur de pages par langue |
| `website/sitemap.xml`, `website/robots.txt` | métadonnées d'exploration |
| `.github/workflows/pages-deploy.yml` | déploie `website/` sur GitHub Pages à chaque push |
| `.github/workflows/release-stats.yml` | instantané quotidien des téléchargements, consigné dans `.gh-stats/downloads.csv` |
| `scripts/gh-download-stats.ps1` | prendre un instantané ou rapporter les variations récentes (`-Report 7`) |
| `docs/` | notes de conception i18n et matière de captures d'écran |
| `_promo/` | chaîne d'outils d'enregistrement des visuels promotionnels |

## Maintenance de ce dépôt

**Publier une nouvelle version — aucune modification de code**

1. Créez un tag `desktop-v*` dans le dépôt source ; son workflow `desktop-release` compile les installateurs des trois plateformes et les téléverse dans les Releases de ce dépôt.
2. Au chargement, la page interroge `/releases/latest` de GitHub pour obtenir le tag `desktop-v*` le plus récent : le badge de version, les liens de téléchargement et le lien vers la Release suivent automatiquement.

`CONFIG.version` et `CONFIG.cliVersion` ne servent que de valeurs de repli, lorsque l'API GitHub limite les requêtes ou que le réseau est coupé.

**Modifier la page elle-même (textes, mise en page, structure)**

1. Modifiez `website/index.html` dans le dépôt source. Les textes vivent dans les dictionnaires `EN` / `OV` : les 58 chaînes statiques de la page sont un instantané pré-rendu que `render()` remplace dans le navigateur à partir du même dictionnaire, donc les deux ne divergent jamais.
2. Si vous avez changé des textes, régénérez les pages par langue : `node website/tools/gen-locales.mjs` (réutilise le même dictionnaire i18n ; les clés non traduites retombent sur l'anglais).
3. Synchronisez `website/` ici et poussez → GitHub Pages se met à jour automatiquement.

**Statistiques de téléchargement** — GitHub n'expose qu'un `download_count` cumulé par fichier ; `release-stats.yml` enregistre donc cette valeur cumulée une fois par jour dans `.gh-stats/downloads.csv`, et les « nouveaux téléchargements sur les N derniers jours » se calculent à partir de cette série avec `powershell -File scripts\gh-download-stats.ps1 -Report 7`.

**Configuration initiale de GitHub Pages** — Settings → Pages → Source : **GitHub Actions**. Le workflow déploie le site ; aucune branche ni dossier à sélectionner.

## Langues

L'interface du produit est disponible en 12 langues ; la page de téléchargement en publie 6, chacune avec sa propre URL statique afin qu'un crawler qui n'exécute pas JavaScript lise tout de même le contenu dans cette langue :

| Langue | URL |
| --- | --- |
| English (par défaut) | <https://deepseekcode.github.io/deepseekwork/> |
| 简体中文 | <https://deepseekcode.github.io/deepseekwork/zh/> |
| 日本語 | <https://deepseekcode.github.io/deepseekwork/ja/> |
| 한국어 | <https://deepseekcode.github.io/deepseekwork/ko/> |
| Español | <https://deepseekcode.github.io/deepseekwork/es/> |
| Français | <https://deepseekcode.github.io/deepseekwork/fr/> |

## Licence

Logiciel propriétaire et à code fermé — ce **n'est pas** un logiciel open source. La copie, la modification, la distribution, la sous-licence ou la vente nécessitent l'autorisation écrite préalable du titulaire des droits. © 2026 DeepSeekCode. Tous droits réservés.

DeepSeekCode est un projet indépendant. Il n'est ni affilié, ni sponsorisé, ni approuvé par DeepSeek (深度求索) ou tout autre fournisseur de modèle ou d'outil. Le nom désigne un runtime client, pas une famille de modèles ; le produit n'embarque aucun modèle et ne fait que piloter l'endpoint compatible OpenAI que vous configurez.
