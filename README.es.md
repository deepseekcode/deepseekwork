# DeepSeekCode

[English](README.md) · [简体中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md)

**Un agente de código con IA que funciona en local: un único runtime local, impulsado por cualquier modelo compatible con OpenAI.**

DeepSeekCode se ejecuta en tu propia máquina y expone el mismo núcleo del agente a través de varias superficies: una interfaz de terminal interactiva, un espacio de trabajo web en `http://localhost:8080`, una API HTTP/WebSocket y un modo por lotes JSONL para CI. Cada llamada a una herramienta pasa por una capa de permisos que tú controlas, y la interfaz está traducida a 12 idiomas.

Este repositorio es el **punto de distribución público**: la página de descargas (GitHub Pages) y los instaladores de escritorio. El repositorio de código fuente es privado.

| | |
| --- | --- |
| Página de descargas | <https://deepseekcode.github.io/deepseekwork/> |
| Instaladores (Releases) | <https://github.com/deepseekcode/deepseekwork/releases> |
| Paquete npm | <https://www.npmjs.com/package/@deepseekcode/cli> |
| Resumen legible por máquina | <https://deepseekcode.github.io/deepseekwork/llms.txt> |

![Interfaz de terminal de DeepSeekCode](website/assets/screenshots/cli.png)

## Características

- **Un runtime, varias superficies** — TUI de terminal, interfaz web, API HTTP + WebSocket y `dscode exec` en JSONL para scripts y CI. No hay un backend aparte que instalar.
- **Capa de permisos en cada llamada a herramienta** — ámbitos `system > project > user > local > session` (gana el más específico), políticas `auto` / `ask` / `deny`, un clasificador de IA opcional para la zona gris y tiempo de espera agotado equivale a denegación.
- **Modo de plan estrictamente de solo lectura** — `/plan` genera una lista de comprobación y nada se ejecuta hasta que la apruebas; el bucle en marcha retoma esa lista en lugar de cambiar de motor.
- **Modos conmutables en caliente** — `act`, `auto-act`, `goal`, `auto-goal`, `chat` (`Shift+Tab` circula entre ellos).
- **Alrededor de 70 herramientas integradas** — archivos, búsqueda, git, LSP, inteligencia de código, navegador, subagentes, planes, memoria, MCP.
- **Shell en sandbox** — bwrap en Linux, SBPL en macOS, MXC / Docker en Windows; si no hay una política disponible, se niega a ejecutar en lugar de recurrir a un shell del host sin sandbox.
- **Extensible** — servidores MCP, skills, plugins, subagentes, trabajo en segundo plano, workflows y canales de mensajería (LINE, Slack, WhatsApp, QQ, DingTalk, Feishu) con verificación de firma en las peticiones entrantes.
- **Durabilidad** — memoria que sobrevive entre sesiones y un watchdog opcional capaz de reanudar una ejecución interrumpida por un motivo distinto de una parada explícita del usuario.
- **Temas** — dark, light, nord, dracula, monokai, one-dark, tokyo-night.

![Espacio de trabajo web de DeepSeekCode](website/assets/screenshots/tools.png)

## Instalación

### npm (Node.js >= 18)

```bash
npm install -g @deepseekcode/cli
dscode
```

Se instalan dos comandos: `dscode` y `deepseekcode`.

### Instaladores de escritorio

| Plataforma | Formatos |
| --- | --- |
| Windows x64 | `.exe` (NSIS), `.msi` |
| macOS (Apple Silicon + Intel) | `.dmg` universal |
| Linux x64 | `.deb`, `.rpm`, `.AppImage` |

Descárgalos desde [Releases](https://github.com/deepseekcode/deepseekwork/releases). Cada archivo incluye su propio `.sig` de firma.

## Primera ejecución

1. Ejecuta `dscode`: arranca el núcleo del agente y el servidor HTTP/WebSocket en un mismo proceso.
2. Abre `http://localhost:8080/#models` y configura un endpoint compatible con OpenAI. Sirve cualquier servidor que hable esa API, incluido uno en `localhost`.
3. Vuelve a la terminal y describe la tarea. Todo lo que escriba archivos o ejecute comandos pasa por la capa de permisos.

## Scripts y CI

```bash
dscode exec "fix the failing test in src/utils"   # una tarea, salida JSONL
dscode exec --file ./task.txt --text              # tarea desde archivo, salida en texto plano
```

`exec` emite un objeto JSON por línea, de modo que el resultado se puede consumir desde un programa; si stdin no es una TTY también se selecciona el modo no interactivo.

## Qué contiene este repositorio

| Ruta | Contenido |
| --- | --- |
| `website/` | la página de descargas: un único `index.html` estático, sincronizado desde el repositorio fuente |
| `website/llms.txt` | resumen legible por máquina para rastreadores de IA (convención llmstxt.org) |
| `website/zh/ ja/ ko/ es/ fr/` | páginas por idioma — **generadas, no editar a mano** |
| `website/tools/gen-locales.mjs` | el generador de páginas por idioma |
| `website/sitemap.xml`, `website/robots.txt` | metadatos de rastreo |
| `.github/workflows/pages-deploy.yml` | despliega `website/` en GitHub Pages al hacer push |
| `.github/workflows/release-stats.yml` | instantánea diaria de descargas, registrada en `.gh-stats/downloads.csv` |
| `scripts/gh-download-stats.ps1` | tomar la instantánea o informar de las variaciones recientes (`-Report 7`) |
| `docs/` | notas de diseño de i18n y material de capturas de la interfaz |
| `_promo/` | cadena de herramientas para grabar material promocional |

## Cómo se mantiene este repositorio

**Publicar una versión nueva — sin tocar código**

1. Crea un tag `desktop-v*` en el repositorio fuente; su workflow `desktop-release` compila los instaladores de las tres plataformas y los sube a las Releases de este repositorio.
2. Al cargar, la página consulta `/releases/latest` de GitHub para obtener el tag `desktop-v*` más reciente: la versión, los enlaces de descarga y el enlace a la Release se actualizan solos.

`CONFIG.version` y `CONFIG.cliVersion` son solo valores de reserva, que se usan cuando la API de GitHub limita las peticiones o no hay red.

**Modificar la página (textos, estilos, estructura)**

1. Edita `website/index.html` en el repositorio fuente. Los textos viven en los diccionarios `EN` / `OV`: las 58 cadenas estáticas de la página son una instantánea prerenderizada que `render()` sobrescribe en el navegador con el mismo diccionario, así que ambos lados nunca se desincronizan.
2. Si cambiaste textos, regenera las páginas por idioma: `node website/tools/gen-locales.mjs` (reutiliza el mismo diccionario i18n; las claves sin traducir vuelven al inglés).
3. Sincroniza `website/` aquí y haz push → GitHub Pages se actualiza automáticamente.

**Estadísticas de descargas** — GitHub solo expone un `download_count` acumulado por archivo, así que `release-stats.yml` registra ese valor acumulado una vez al día en `.gh-stats/downloads.csv`; las "descargas nuevas en los últimos N días" se calculan a partir de esa serie con `powershell -File scripts\gh-download-stats.ps1 -Report 7`.

**Configuración inicial de GitHub Pages** — Settings → Pages → Source: **GitHub Actions**. El workflow despliega el sitio; no hay que elegir rama ni carpeta.

## Idiomas

La interfaz del producto está disponible en 12 idiomas; la página de descargas publica 6, cada uno con su propia URL estática para que un rastreador que no ejecuta JavaScript siga leyendo el contenido en ese idioma:

| Idioma | URL |
| --- | --- |
| English (por defecto) | <https://deepseekcode.github.io/deepseekwork/> |
| 简体中文 | <https://deepseekcode.github.io/deepseekwork/zh/> |
| 日本語 | <https://deepseekcode.github.io/deepseekwork/ja/> |
| 한국어 | <https://deepseekcode.github.io/deepseekwork/ko/> |
| Español | <https://deepseekcode.github.io/deepseekwork/es/> |
| Français | <https://deepseekcode.github.io/deepseekwork/fr/> |

## Licencia

Software propietario y de código cerrado: **no** es código abierto. Copiar, modificar, distribuir, sublicenciar o vender requiere autorización previa por escrito del titular de los derechos. © 2026 DeepSeekCode. Todos los derechos reservados.

DeepSeekCode es un proyecto independiente. No está afiliado, patrocinado ni respaldado por DeepSeek (深度求索) ni por ningún otro proveedor de modelos o herramientas. El nombre designa un runtime cliente, no una familia de modelos, y el producto no incluye ningún modelo propio: solo utiliza el endpoint compatible con OpenAI que configures.
