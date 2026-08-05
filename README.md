# DeepSeekCode 下载中心

公开下载页 + 安装包分发仓库（源仓库 `deepseekcode/deepseekcode` 为私有，安装包在此公开分发）。

- **下载页（GitHub Pages）**: `https://deepseekcode.github.io/deepseekwork/`
- **安装包 Releases**: `https://github.com/deepseekcode/deepseekwork/releases`

## 内容

- `website/` — 静态单文件下载页（来源：源仓库 `deepseekcode/deepseekcode` 的 `website/` 目录）
- `.github/workflows/pages-deploy.yml` — 推送 `website/` 时自动部署到 GitHub Pages

## 如何更新

**发布新版本（常规流程）——无需改任何代码：**

1. 在源仓库 `deepseekcode/deepseekcode` 打 `desktop-v*` tag → `desktop-release` workflow 自动构建三平台安装包并上传到本仓库 Releases
2. 下载页启动时自动拉取 GitHub `/releases/latest` 的最新 `desktop-v*` tag，版本号、下载链接、Release 页全部自动指向新版

> `CONFIG.version` / `CONFIG.cliVersion` 只是**兜底版本**（GitHub API 限流/断网时才用），正常情况不参与显示。若长时间未发版想保持兜底新鲜，可在源仓库顺手把 `website/index.html` 里这两个值刷成最近一次实际发布。

**修改页面本身（样式/文案/结构）：**

1. 在源仓库 `deepseekcode/deepseekcode` 修改 `website/index.html`
2. 把最新 `website/` 同步回本仓库并推送 → Pages 自动更新

**安装包** 由源仓库的 `desktop-release` workflow 构建后自动上传到本仓库 Releases（tag: `desktop-v*`）。

## 启用 GitHub Pages（一次性）

Settings → Pages → Source 选 **GitHub Actions**（本仓库的 workflow 会自动部署，无需选分支/目录）。
