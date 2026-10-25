# DeepSeekCode

[English](README.md) · [简体中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [Italiano](README.it.md) · [العربية](README.ar.md) · [Bahasa Indonesia](README.id.md)

**Agen coding AI yang berjalan lokal: satu runtime di mesin Anda sendiri, digerakkan oleh model apa pun yang kompatibel dengan OpenAI.**

DeepSeekCode berjalan di komputer Anda sendiri dan menyediakan inti agen yang sama lewat beberapa antarmuka: TUI terminal interaktif, ruang kerja web di `http://localhost:8080`, API HTTP/WebSocket, dan mode batch JSONL untuk CI. Setiap pemanggilan alat melewati lapisan izin yang Anda kendalikan, dan antarmukanya tersedia dalam 12 bahasa.

Repositori ini adalah **titik distribusi publik**: halaman unduhan (GitHub Pages) beserta installer desktop. Repositori kode sumbernya bersifat privat.

| | |
| --- | --- |
| Halaman unduhan | <https://deepseekcode.github.io/deepseekwork/> |
| Installer (Releases) | <https://github.com/deepseekcode/deepseekwork/releases> |
| Paket npm | <https://www.npmjs.com/package/@deepseekcode/cli> |
| Ringkasan untuk mesin | <https://deepseekcode.github.io/deepseekwork/llms.txt> |

![Antarmuka terminal DeepSeekCode](website/assets/screenshots/cli.png)

## Keunggulan

- **Satu runtime, beberapa antarmuka** — TUI terminal, UI web, API HTTP + WebSocket, dan `dscode exec` berformat JSONL untuk skrip dan CI. Tidak ada backend terpisah yang perlu dipasang.
- **Lapisan izin pada setiap pemanggilan alat** — cakupan `system > project > user > local > session` (yang paling sempit menang), kebijakan `auto` / `ask` / `deny`, pengklasifikasi AI opsional untuk zona abu-abu, dan timeout berarti penolakan.
- **Mode rencana yang murni hanya-baca** — `/plan` menghasilkan daftar tugas; tidak ada yang dijalankan sebelum Anda menyetujuinya, dan proses yang sedang berjalan memakai daftar itu, bukan berganti mesin.
- **Mode yang bisa diganti saat berjalan** — `act`, `auto-act`, `goal`, `auto-goal`, `chat` (`Shift+Tab` bergilir).
- **Sekitar 70 alat bawaan** — berkas, pencarian, git, LSP, pemahaman kode, peramban, subagen, rencana, memori, MCP.
- **Alat shell dalam sandbox** — bwrap di Linux, SBPL di macOS, MXC / Docker di Windows; bila tidak ada kebijakan yang tersedia, ia menolak menjalankan perintah alih-alih mundur ke shell host tanpa sandbox.
- **Dapat diperluas** — server MCP, skill, plugin, subagen, pekerjaan latar belakang, workflow, dan kanal perpesanan (LINE, Slack, WhatsApp, QQ, DingTalk, Feishu) dengan verifikasi tanda tangan pada permintaan masuk.
- **Tahan lama** — memori yang bertahan antar sesi, plus watchdog opsional yang bisa melanjutkan proses yang terputus karena sebab selain penghentian eksplisit oleh pengguna.
- **Tema** — dark, light, nord, dracula, monokai, one-dark, tokyo-night.

![Ruang kerja web DeepSeekCode](website/assets/screenshots/tools.png)

## Instalasi

### npm (Node.js >= 18)

```bash
npm install -g @deepseekcode/cli
dscode
```

Dua perintah akan terpasang: `dscode` dan `deepseekcode`.

### Installer desktop

| Platform | Format |
| --- | --- |
| Windows x64 | `.exe` (NSIS), `.msi` |
| macOS (Apple Silicon + Intel) | `.dmg` universal |
| Linux x64 | `.deb`, `.rpm`, `.AppImage` |

Unduh dari [Releases](https://github.com/deepseekcode/deepseekwork/releases). Setiap berkas disertai tanda tangan `.sig` dengan nama yang sama.

## Menjalankan pertama kali

1. Jalankan `dscode` — inti agen dan server HTTP/WebSocket dijalankan dalam satu proses.
2. Buka `http://localhost:8080/#models` lalu konfigurasikan endpoint yang kompatibel dengan OpenAI. Server apa pun yang berbicara API itu bisa dipakai, termasuk yang berjalan di `localhost`.
3. Kembali ke terminal dan jelaskan tugasnya. Apa pun yang menulis berkas atau menjalankan perintah akan melewati lapisan izin.

## Skrip dan CI

```bash
dscode exec "fix the failing test in src/utils"   # satu tugas, keluaran JSONL
dscode exec --file ./task.txt --text              # tugas dari berkas, keluaran teks biasa
```

`exec` mengeluarkan satu objek JSON per baris sehingga hasilnya bisa dikonsumsi oleh program; stdin yang bukan TTY juga memilih mode noninteraktif.

## Isi repositori ini

| Path | Isi |
| --- | --- |
| `website/` | halaman unduhan — satu `index.html` statis, disalin dari repositori kode sumber |
| `website/llms.txt` | ringkasan untuk perayap AI (konvensi llmstxt.org) |
| `website/zh/ ja/ ko/ es/ fr/` | halaman per bahasa — **dihasilkan otomatis, jangan diedit manual** |
| `website/tools/gen-locales.mjs` | generator halaman per bahasa |
| `website/sitemap.xml`, `website/robots.txt` | metadata perayapan |
| `.github/workflows/pages-deploy.yml` | men-deploy `website/` ke GitHub Pages setiap push |
| `.github/workflows/release-stats.yml` | cuplikan jumlah unduhan harian yang dicatat ke `.gh-stats/downloads.csv` |
| `scripts/gh-download-stats.ps1` | mengambil cuplikan atau melaporkan selisih terbaru (`-Report 7`) |
| `docs/` | catatan desain i18n dan materi tangkapan layar |
| `_promo/` | rantai alat perekaman materi promosi |

## Cara repositori ini dikelola

**Merilis versi baru — tanpa mengubah kode**

1. Buat tag `desktop-v*` di repositori kode sumber; workflow `desktop-release` miliknya akan membangun installer untuk tiga platform dan mengunggahnya ke Releases repositori ini.
2. Saat dimuat, halaman menanyakan `/releases/latest` di GitHub untuk tag `desktop-v*` terbaru — lencana versi, tautan unduhan, dan tautan Release mengikuti secara otomatis.

`CONFIG.version` dan `CONFIG.cliVersion` hanya nilai cadangan, dipakai ketika API GitHub membatasi permintaan atau jaringan terputus.

**Mengubah halaman itu sendiri (teks, tata letak, struktur)**

1. Edit `website/index.html` di repositori kode sumber. Teksnya berada di kamus `EN` / `OV`: 58 string statis di halaman adalah cuplikan yang sudah dirender lebih dulu, dan `render()` menimpanya di peramban dari kamus yang sama, jadi keduanya tidak pernah menyimpang.
2. Jika teks berubah, hasilkan ulang halaman per bahasa: `node website/tools/gen-locales.mjs` (memakai ulang kamus i18n yang sama; kunci yang belum diterjemahkan kembali ke bahasa Inggris).
3. Sinkronkan `website/` ke sini lalu push → GitHub Pages diperbarui otomatis.

**Statistik unduhan** — GitHub hanya menyediakan `download_count` kumulatif per berkas, jadi `release-stats.yml` mencatat nilai kumulatif itu sekali sehari ke `.gh-stats/downloads.csv`; "unduhan baru dalam N hari terakhir" dihitung dari deret itu dengan `powershell -File scripts\gh-download-stats.ps1 -Report 7`.

**Penyiapan GitHub Pages sekali saja** — Settings → Pages → Source: pilih **GitHub Actions**. Workflow yang men-deploy situsnya; tidak perlu memilih branch atau folder.

## Bahasa

Antarmuka produk tersedia dalam 12 bahasa; halaman unduhan menerbitkan 6, masing-masing dengan URL statis sendiri agar perayap yang tidak menjalankan JavaScript tetap membaca konten dalam bahasa tersebut:

| Bahasa | URL |
| --- | --- |
| English (bawaan) | <https://deepseekcode.github.io/deepseekwork/> |
| 简体中文 | <https://deepseekcode.github.io/deepseekwork/zh/> |
| 日本語 | <https://deepseekcode.github.io/deepseekwork/ja/> |
| 한국어 | <https://deepseekcode.github.io/deepseekwork/ko/> |
| Español | <https://deepseekcode.github.io/deepseekwork/es/> |
| Français | <https://deepseekcode.github.io/deepseekwork/fr/> |

## Lisensi

Perangkat lunak berpemilik dan tertutup — **bukan** open source. Menyalin, mengubah, mendistribusikan, menyublisensikan, atau menjual memerlukan izin tertulis sebelumnya dari pemegang hak cipta. © 2026 DeepSeekCode. Hak cipta dilindungi.

DeepSeekCode adalah proyek independen. Ia tidak berafiliasi dengan, disponsori, atau didukung oleh DeepSeek (深度求索) maupun vendor model atau alat mana pun. Nama ini merujuk pada runtime klien, bukan keluarga model, dan produknya tidak membawa model sendiri — ia hanya menggerakkan endpoint kompatibel OpenAI yang Anda konfigurasikan.
