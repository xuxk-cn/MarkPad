# MarkPad

Lightweight **Markdown** desktop editor for Windows, built with **Tauri v2** (Rust + WebView2) and a small **TypeScript** front end (Vite, no React/Vue shell).

**中文说明**：面向用户的操作步骤见根目录 **[使用手册.md](./使用手册.md)**；开发与排障见 **[docs/启动与使用手册.md](./docs/启动与使用手册.md)** 与 **[RUN.md](./RUN.md)**。

---

## Features

- **Single-surface editing** — Markdown source with a read-only preview overlay (Typora-like), no split preview pane.
- **Rust `ropey` document** — single source of truth; syncs from the editor with debounced IPC.
- **Obsidian-style auto-save** — when a file path is set, changes flush to disk after ~1.2s idle + a 30s safety timer.
- **Find in document** — `Ctrl+F`, Rust-backed search.
- **Settings** — light/dark theme, Chinese/English UI, **Ctrl + mouse wheel** font zoom in the editor.
- **Context menu** — insert snippets (footnote, table, callout, HR, fenced code, math block) and inline formatting.

---

## Requirements

- **Windows** 10/11 with **WebView2** (bundled on Win11; Win10 may need [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)).
- **Node.js** ≥ 18  
- **Rust** stable (`rustup`)

---

## Quick start

Clone this repository, then run:

```powershell
cd markpad
npm install
npm run tauri dev
```

First Rust build can take several minutes.

---

## NPM scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server only (browser) |
| `npm run tauri dev` | Full Tauri app |
| `npm run build` | `tsc` + Vite production build |
| `npm run check` | TypeScript `--noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run test:all` | `check` + Vitest + `cargo test` in `src-tauri` |
| `npm run tauri build` | Release bundle (see `tauri.conf.json`) |
| `npm run icons` | Regenerate `src-tauri/icons` from `./logo.png` |

Windows packaging (installers + portable exe, `CARGO_TARGET_DIR`, post-build cleanup): [`docs/打包说明.md`](./docs/打包说明.md).  
Windows installer batch helper: [`scripts/build-non-standalone.bat`](./scripts/build-non-standalone.bat) (NSIS + MSI; after success it trims `output/release/` down to **`bundle/`** only).  
Portable **no-installer** Release exe: [`scripts/build-portable-no-installer.bat`](./scripts/build-portable-no-installer.bat) (`tauri build --no-bundle`; sets `CARGO_TARGET_DIR` to `./output`, then keeps **only** `*.exe` / `*.dll` under `output/release/`, typically `MarkPad.exe`; plain `npm run tauri build` without that env still uses `src-tauri/target/release/`). **Do not run** `clean-pack-release.bat` manually after these batch files; they invoke it on success.

---

## Repository layout

| Path | Role |
|------|------|
| `src/` | Front-end TypeScript (editor, i18n, settings, renderer) |
| `src-tauri/` | Rust crate + `tauri.conf.json` |
| `docs/` | Product spec (`开发方案讨论稿.md`), dev log, detailed manual |
| `使用手册.md` | Short end-user manual (Chinese) |
| `public/` | Static assets served by Vite (e.g. `logo.png` for the title bar) |

---

## Documentation index

| Document | Audience |
|----------|----------|
| [使用手册.md](./使用手册.md) | End users (Chinese, concise) |
| [docs/启动与使用手册.md](./docs/启动与使用手册.md) | Users + contributors (detailed) |
| [RUN.md](./RUN.md) | Fast run & cargo mirror tips |
| [docs/打包说明.md](./docs/打包说明.md) | Windows release packaging (batch scripts, cleanup, paths) |
| [docs/开发方案讨论稿.md](./docs/开发方案讨论稿.md) | Architecture & roadmap |
| [docs/开发日志.md](./docs/开发日志.md) | Change log / decisions |

---

## Contributing

Run `npm run test:all` before submitting changes. Match existing code style; keep diffs focused on the task.
