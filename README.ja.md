# DeepSeekCode

[English](README.md) · [简体中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md)

**ローカルファーストの AI コーディングエージェント。ローカルで動く 1 つのランタイムが、OpenAI 互換モデルで動きます。**

DeepSeekCode は自分のマシン上で動作し、同じエージェントコアを複数の入口から使えるようにします —— 対話型ターミナル UI、`http://localhost:8080` の Web ワークスペース、HTTP/WebSocket API、そして CI 向けの JSONL バッチモードです。ツール呼び出しはすべて自分で制御できる権限レイヤーを通り、UI は 12 言語に対応しています。

このリポジトリは**公開配布用**です。ダウンロードページ（GitHub Pages）とデスクトップインストーラーを置いています。ソースリポジトリは非公開です。

| | |
| --- | --- |
| ダウンロードページ | <https://deepseekcode.github.io/deepseekwork/> |
| インストーラー（Releases） | <https://github.com/deepseekcode/deepseekwork/releases> |
| npm パッケージ | <https://www.npmjs.com/package/@deepseekcode/cli> |
| 機械可読サマリー | <https://deepseekcode.github.io/deepseekwork/llms.txt> |

![DeepSeekCode のターミナル UI](website/assets/screenshots/cli.png)

## 主な特徴

- **1 つのランタイム、複数の入口** —— ターミナル TUI、Web UI、HTTP + WebSocket API、スクリプトや CI 向けの `dscode exec` JSONL。別途バックエンドを入れる必要はありません。
- **すべてのツール呼び出しに権限レイヤー** —— スコープは `system > project > user > local > session`（狭い方が優先）、ポリシーは `auto` / `ask` / `deny`、グレーゾーン向けの任意の AI 分類器、タイムアウトは拒否として扱われます。
- **厳密に読み取り専用のプランモード** —— `/plan` はチェックリストを出力し、承認するまで何も実行しません。実行時はエンジンを切り替えず、動作中のループがそのチェックリストを引き継ぎます。
- **実行中に切り替えられるモード** —— `act`、`auto-act`、`goal`、`auto-goal`、`chat`（`Shift+Tab` で巡回）。
- **約 70 の組み込みツール** —— ファイル、検索、git、LSP、コードインテリジェンス、ブラウザ、サブエージェント、プラン、メモリ、MCP。
- **サンドボックス化されたシェル** —— Linux は bwrap、macOS は SBPL、Windows は MXC / Docker。利用できるポリシーがない場合は、サンドボックスなしのホストシェルに落とさず実行自体を拒否します。
- **拡張可能** —— MCP サーバー、スキル、プラグイン、サブエージェント、バックグラウンド処理、ワークフロー、そして IM チャネル（LINE、Slack、WhatsApp、QQ、DingTalk、Feishu）。受信リクエストは署名検証されます。
- **継続性** —— セッションをまたぐメモリと、任意で有効化できるウォッチドッグ。ユーザーが明示的に停止した以外の理由で途切れた実行を再開できます。
- **テーマ** —— dark、light、nord、dracula、monokai、one-dark、tokyo-night。

![DeepSeekCode の Web ワークスペース](website/assets/screenshots/tools.png)

## インストール

### npm（Node.js >= 18）

```bash
npm install -g @deepseekcode/cli
dscode
```

`dscode` と `deepseekcode` の 2 つのコマンドが入ります。

### デスクトップインストーラー

| プラットフォーム | 形式 |
| --- | --- |
| Windows x64 | `.exe`（NSIS）、`.msi` |
| macOS（Apple Silicon + Intel） | ユニバーサル `.dmg` |
| Linux x64 | `.deb`、`.rpm`、`.AppImage` |

[Releases](https://github.com/deepseekcode/deepseekwork/releases) から入手してください。各アセットには同名の `.sig` 署名ファイルが付きます。

## 初回起動

1. `dscode` を実行します。エージェントコアと HTTP/WebSocket サーバーが同じプロセスで起動します。
2. `http://localhost:8080/#models` を開き、OpenAI 互換のエンドポイントを設定します。この API を話すサーバーなら何でも使えます（`localhost` 上のサーバーも含む）。
3. ターミナルに戻ってタスクを伝えます。ファイル書き込みやコマンド実行は権限レイヤーを通ります。

## スクリプトと CI

```bash
dscode exec "fix the failing test in src/utils"   # 単一タスク、出力は JSONL
dscode exec --file ./task.txt --text              # タスクをファイルから、出力はプレーンテキスト
```

`exec` は 1 行 1 JSON オブジェクトで出力するため、プログラムからそのまま扱えます。stdin が TTY でない場合も非対話モードになります。

## このリポジトリの内容

| パス | 内容 |
| --- | --- |
| `website/` | ダウンロードページ。単一の静的 `index.html` をソースリポジトリから同期したもの |
| `website/llms.txt` | AI クローラー向けの機械可読サマリー（llmstxt.org 準拠） |
| `website/zh/ ja/ ko/ es/ fr/` | 言語別ページ —— **自動生成。手で編集しないでください** |
| `website/tools/gen-locales.mjs` | 言語別ページのジェネレーター |
| `website/sitemap.xml`、`website/robots.txt` | クロール用メタデータ |
| `.github/workflows/pages-deploy.yml` | push 時に `website/` を GitHub Pages へデプロイ |
| `.github/workflows/release-stats.yml` | 毎日のダウンロード数を `.gh-stats/downloads.csv` に記録 |
| `scripts/gh-download-stats.ps1` | スナップショット取得と直近増分のレポート（`-Report 7`） |
| `docs/` | i18n 設計メモと UI スクリーンショット素材 |
| `_promo/` | プロモーション素材の収録ツールチェーン |

## このリポジトリの運用

**新バージョンの配布 —— コード変更は不要**

1. ソースリポジトリで `desktop-v*` タグを打つと、`desktop-release` ワークフローが 3 プラットフォーム分のインストーラーをビルドし、このリポジトリの Releases にアップロードします。
2. ページは読み込み時に GitHub の `/releases/latest` から最新の `desktop-v*` タグを取得します。バージョンバッジ、ダウンロードリンク、Release へのリンクはすべて自動で追随します。

`CONFIG.version` / `CONFIG.cliVersion` はあくまでフォールバックで、GitHub API のレート制限やオフライン時にのみ使われます。

**ページ自体の変更（文言・レイアウト・構成）**

1. ソースリポジトリの `website/index.html` を編集します。文言は `EN` / `OV` の辞書にあります。ページ上の 58 か所の静的テキストは事前レンダリングされたスナップショットで、`render()` がブラウザ上で同じ辞書から上書きするため、両者がずれることはありません。
2. 文言を変えたら言語別ページを再生成します: `node website/tools/gen-locales.mjs`（同じ i18n 辞書を再利用し、未翻訳キーは英語にフォールバック）。
3. 最新の `website/` をこのリポジトリに同期して push → GitHub Pages が自動更新されます。

**ダウンロード統計** —— GitHub はアセットごとの**累計** `download_count` しか公開しないため、`release-stats.yml` が 1 日 1 回その累計値を `.gh-stats/downloads.csv` に記録します。「直近 N 日の新規ダウンロード」はこの系列から `powershell -File scripts\gh-download-stats.ps1 -Report 7` で算出します。

**GitHub Pages の初回設定** —— Settings → Pages → Source で **GitHub Actions** を選択。デプロイはワークフローが行うため、ブランチやフォルダの指定は不要です。

## 言語

製品 UI は 12 言語、ダウンロードページは 6 言語を公開しています。各言語に固有の静的 URL があるため、JavaScript を実行しないクローラーでもその言語の内容を読めます:

| 言語 | URL |
| --- | --- |
| English（既定） | <https://deepseekcode.github.io/deepseekwork/> |
| 简体中文 | <https://deepseekcode.github.io/deepseekwork/zh/> |
| 日本語 | <https://deepseekcode.github.io/deepseekwork/ja/> |
| 한국어 | <https://deepseekcode.github.io/deepseekwork/ko/> |
| Español | <https://deepseekcode.github.io/deepseekwork/es/> |
| Français | <https://deepseekcode.github.io/deepseekwork/fr/> |

## ライセンス

プロプライエタリかつクローズドソースであり、**オープンソースではありません**。複製、改変、配布、サブライセンス、販売には著作権者による事前の書面による許諾が必要です。© 2026 DeepSeekCode. All rights reserved.

DeepSeekCode は独立したプロジェクトです。DeepSeek（深度求索）その他いかなるモデル／ツールベンダーとも、提携・スポンサー・推奨の関係はありません。名称はクライアントランタイムを指すもので、モデルファミリーを指すものではありません。製品自体はモデルを同梱せず、設定した OpenAI 互換エンドポイントを駆動するだけです。
