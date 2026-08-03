# DeepSeekCode 下载中心

公开下载页 + 安装包分发仓库（源仓库 `deepseekcode/deepseekcode` 为私有，安装包在此公开分发）。

- **下载页（GitHub Pages）**: `https://deepseekcode.github.io/deepseekwork/`
- **安装包 Releases**: `https://github.com/deepseekcode/deepseekwork/releases`

## 内容

- `website/` — 静态单文件下载页（来源：源仓库 `deepseekcode/deepseekcode` 的 `website/` 目录）
- `.github/workflows/pages-deploy.yml` — 推送 `website/` 时自动部署到 GitHub Pages

## 如何更新

1. 在源仓库 `deepseekcode/deepseekcode` 修改 `website/index.html`（如改 `CONFIG.version`）
2. 把最新 `website/` 同步回本仓库并推送 → Pages 自动更新
3. 安装包由源仓库的 `desktop-release` workflow 构建后自动上传到本仓库 Releases（tag: `desktop-v*`）

## 启用 GitHub Pages（一次性）

Settings → Pages → Source 选 **GitHub Actions**（本仓库的 workflow 会自动部署，无需选分支/目录）。
