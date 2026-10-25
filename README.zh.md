# DeepSeekCode

[English](README.md) · [简体中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [Italiano](README.it.md) · [العربية](README.ar.md) · [Bahasa Indonesia](README.id.md)

**本地优先的 AI 编程代理：一个本地运行时，接任何 OpenAI 兼容模型。**

DeepSeekCode 跑在你自己的机器上，同一个代理内核对外提供几种入口——交互式终端界面、`http://localhost:8080` 的网页工作区、HTTP/WebSocket API，以及给 CI 用的 JSONL 批处理模式。每次工具调用都要经过你可以控制的权限层，界面支持 12 种语言。

本仓库是**公开分发点**：下载页（GitHub Pages）+ 桌面安装包。源仓库为私有仓库。

| | |
| --- | --- |
| 下载页 | <https://deepseekcode.github.io/deepseekwork/> |
| 安装包（Releases） | <https://github.com/deepseekcode/deepseekwork/releases> |
| npm 包 | <https://www.npmjs.com/package/@deepseekcode/cli> |
| 机器可读摘要 | <https://deepseekcode.github.io/deepseekwork/llms.txt> |

![DeepSeekCode 终端界面](website/assets/screenshots/cli.png)

## 核心特性

- **一个运行时，几种入口** —— 终端 TUI、网页 UI、HTTP + WebSocket API，以及给脚本和 CI 用的 `dscode exec` JSONL。不需要另装后端。
- **每次工具调用都有权限层** —— 作用域 `system > project > user > local > session`（最窄的优先）、`auto` / `ask` / `deny` 三种策略、灰色地带可选 AI 分类器，超时即拒绝。
- **严格只读的计划模式** —— `/plan` 产出一份清单，你不批准就什么都不执行；执行时由运行中的循环接管清单，而不是切换引擎。
- **运行时可切换的模式** —— `act`、`auto-act`、`goal`、`auto-goal`、`chat`（`Shift+Tab` 轮换）。
- **约 70 个内置工具** —— 文件、搜索、git、LSP、代码智能、浏览器、子代理、计划、记忆、MCP。
- **沙箱化的 shell 工具** —— Linux 用 bwrap，macOS 用 SBPL，Windows 用 MXC / Docker；没有可用策略时它宁可拒绝执行，也不退回无沙箱的宿主 shell。
- **可扩展** —— MCP 服务器、技能、插件、子代理、后台任务、工作流，以及 IM 通道（LINE、Slack、WhatsApp、QQ、钉钉、飞书），入站请求带签名校验。
- **可续跑** —— 记忆跨会话保留；可选看门狗能把「非用户主动停止」而中断的运行接着跑完。
- **主题** —— dark、light、nord、dracula、monokai、one-dark、tokyo-night。

![DeepSeekCode 网页工作区](website/assets/screenshots/tools.png)

## 安装

### npm（Node.js >= 18）

```bash
npm install -g @deepseekcode/cli
dscode
```

装完会有两个命令：`dscode` 和 `deepseekcode`。

### 桌面安装包

| 平台 | 格式 |
| --- | --- |
| Windows x64 | `.exe`（NSIS）、`.msi` |
| macOS（Apple Silicon + Intel） | 通用 `.dmg` |
| Linux x64 | `.deb`、`.rpm`、`.AppImage` |

从 [Releases](https://github.com/deepseekcode/deepseekwork/releases) 下载。每个资产都带同名 `.sig` 签名文件。

## 第一次运行

1. 执行 `dscode` —— 它在同一个进程里启动代理内核和 HTTP/WebSocket 服务。
2. 打开 `http://localhost:8080/#models`，配置一个 OpenAI 兼容端点。任何实现该 API 的服务都能用，跑在 `localhost` 上的自建服务也算。
3. 回到终端，直接说任务。凡是写文件、执行命令这类动作，都会经过权限层。

## 脚本与 CI

```bash
dscode exec "fix the failing test in src/utils"   # 单个任务，输出 JSONL
dscode exec --file ./task.txt --text              # 任务从文件读，输出纯文本
```

`exec` 每行输出一个 JSON 对象，方便程序消费；stdin 非 TTY 时也会自动进入非交互模式。

## 本仓库有什么

| 路径 | 内容 |
| --- | --- |
| `website/` | 下载页 —— 单个静态 `index.html`，从源仓库同步而来 |
| `website/llms.txt` | 给 AI 爬虫的机器可读项目摘要（llmstxt.org 约定） |
| `website/zh/ ja/ ko/ es/ fr/` | 各语言页 —— **自动生成，请勿手改** |
| `website/tools/gen-locales.mjs` | 语言页生成器 |
| `website/sitemap.xml`、`website/robots.txt` | 抓取元数据 |
| `.github/workflows/pages-deploy.yml` | 推送后把 `website/` 部署到 GitHub Pages |
| `.github/workflows/release-stats.yml` | 每日下载量打点，提交进 `.gh-stats/downloads.csv` |
| `scripts/gh-download-stats.ps1` | 打点或看近期增量（`-Report 7`） |
| `docs/` | 多语言设计稿与界面截图素材 |
| `_promo/` | 宣传素材录制工具链 |

## 本仓库怎么维护

**发布新版本 —— 无需改任何代码**

1. 在源仓库打 `desktop-v*` tag，其 `desktop-release` workflow 会构建三平台安装包并上传到本仓库 Releases。
2. 下载页启动时自动向 GitHub 查询 `/releases/latest` 里最新的 `desktop-v*` tag —— 版本号徽标、下载链接、Release 链接全部自动跟随。

`CONFIG.version` / `CONFIG.cliVersion` 只是**兜底版本**，仅在 GitHub API 限流或断网时使用。

**修改页面本身（文案、样式、结构）**

1. 在源仓库改 `website/index.html`。文案在 `EN` / `OV` 两份字典里 —— 页面上 58 处静态文本是预渲染快照，`render()` 会在浏览器里用同一份字典覆盖它，两边不会漂移。
2. 改了文案就重新生成语言页：`node website/tools/gen-locales.mjs`（复用同一份 i18n 字典，未翻译的键回退英文）。
3. 把最新 `website/` 同步到本仓库并推送 → GitHub Pages 自动更新。

**下载量统计** —— GitHub 只给每个资产的**累计** `download_count`，所以 `release-stats.yml` 每天把累计值记进 `.gh-stats/downloads.csv`，「最近 N 天新增」由这串数据算出来：`powershell -File scripts\gh-download-stats.ps1 -Report 7`。

**GitHub Pages 一次性设置** —— Settings → Pages → Source 选 **GitHub Actions**。workflow 负责部署，不用选分支或目录。

## 多语言

产品界面支持 12 种语言；下载页发布 6 种，每种都有自己的静态 URL，不执行 JavaScript 的爬虫也能读到该语言的内容：

| 语言 | URL |
| --- | --- |
| English（默认） | <https://deepseekcode.github.io/deepseekwork/> |
| 简体中文 | <https://deepseekcode.github.io/deepseekwork/zh/> |
| 日本語 | <https://deepseekcode.github.io/deepseekwork/ja/> |
| 한국어 | <https://deepseekcode.github.io/deepseekwork/ko/> |
| Español | <https://deepseekcode.github.io/deepseekwork/es/> |
| Français | <https://deepseekcode.github.io/deepseekwork/fr/> |

## 许可

专有软件，闭源 —— **不是**开源项目。复制、修改、分发、再许可或销售需事先取得版权持有人的书面许可。© 2026 DeepSeekCode. All rights reserved.

DeepSeekCode 是独立项目，与 DeepSeek（深度求索）或任何模型 / 工具厂商没有隶属、赞助或背书关系。名字指的是客户端运行时，不是某个模型家族；产品本身不带模型 —— 它只驱动你配置的那个 OpenAI 兼容端点。
