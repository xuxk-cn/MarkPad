# MarkPad

Lightweight **Markdown** desktop editor for Windows, built with **Tauri v2** (Rust + WebView2) and a small **TypeScript** front end (Vite, no React/Vue shell).

🌐 **Languages:** [中文](./README.md) | English | [Deutsch](./README.de.md) | [Français](./README.fr.md) | [Italiano](./README.it.md) | [Español](./README.es.md)

**For Chinese users:** end-user instructions are available in **[使用手册.md](./使用手册.md)** (concise). For development & troubleshooting see **[docs/启动与使用手册.md](./docs/启动与使用手册.md)** and **[RUN.md](./RUN.md)**.

---

## Features

- **Single-surface editing** — Markdown source with a read-only preview overlay (Typora-like), no split preview pane.
- **Rust `ropey` document** — single source of truth; syncs from the editor with debounced IPC.
- **Obsidian-style auto-save** — when a file path is set, changes flush to disk after ~1.2s idle plus a 30s safety timer.
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

The first Rust build can take several minutes.

---

## NPM scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server only (browser preview, no Tauri window) |
| `npm run tauri dev` | Full Tauri app |
| `npm run build` | `tsc` + Vite production build |
| `npm run check` | TypeScript `--noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run test:all` | `check` → Vitest → `cargo test` inside `src-tauri` |
| `npm run tauri build` | Release bundles (see `tauri.conf.json`) |
| `npm run icons` | Regenerate `src-tauri/icons` from `./logo.png` |

Windows packaging (installers + portable exe, `CARGO_TARGET_DIR`, post-build cleanup): see [`docs/打包说明.md`](./docs/打包说明.md).

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
