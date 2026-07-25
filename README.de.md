# MarkPad

Leichtgewichtiger **Markdown**-Desktop-Editor für Windows, erstellt mit **Tauri v2** (Rust + WebView2) und einem schlanken **TypeScript**-Frontend (Vite, ohne React/Vue).

🌐 **Languages:** [中文](./README.md) | [English](./README.en.md) | Deutsch | [Français](./README.fr.md) | [Italiano](./README.it.md) | [Español](./README.es.md)

**Hinweis für chinesische Benutzer:** Eine kurze Bedienungsanleitung für Endnutzer liegt unter **[使用手册.md](./使用手册.md)**. Für Entwicklung und Fehlerbehebung siehe **[docs/启动与使用手册.md](./docs/启动与使用手册.md)** und **[RUN.md](./RUN.md)**.

---

## Funktionen

- **Einzeloberflächen-Bearbeitung** — Markdown-Quelltext mit überlagerter schreibgeschützter Vorschau (ähnlich Typora), ohne geteiltes Vorschaufenster.
- **Rust `ropey`-Dokumentmodell** — Single Source of Truth; Synchronisation vom Editor über entprelltes IPC.
- **Obsidian-ähnliches automatisches Speichern** — sobald ein Dateipfad gesetzt ist, werden Änderungen nach ~1,2 s Inaktivität und zusätzlich über einen 30-Sekunden-Sicherheitstimer auf die Festplatte geschrieben.
- **Im Dokument suchen** — `Strg+F`, Suche auf Rust-Backend basierend.
- **Einstellungen** — helles/dunkles Theme, Benutzeroberfläche Chinesisch/Englisch, Schriftgröße im Editor per **Strg + Mausrad**.
- **Kontextmenü** — Einfügen von Bausteinen (Fußnote, Tabelle, Callout, Trennlinie, Codeblock mit Zaun, Mathematikblock) sowie Inline-Formatierungen.

---

## Voraussetzungen

- **Windows** 10/11 mit **WebView2** (bei Win11 vorinstalliert; Win10 benötigt ggf. die manuelle Installation der [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)).
- **Node.js** ≥ 18
- **Rust** stable (installiert über `rustup`)

---

## Schnellstart

Repository klonen und in PowerShell ausführen:

```powershell
cd markpad
npm install
npm run tauri dev
```

Der erste Rust-Build kann mehrere Minuten dauern.

---

## NPM-Skripte

| Skript | Beschreibung |
|--------|--------------|
| `npm run dev` | Nur den Vite-Entwicklungsserver starten (Browser-Vorschau, ohne Tauri-Fenster) |
| `npm run tauri dev` | Vollständige Tauri-Anwendung starten |
| `npm run build` | `tsc` + Vite-Produktionsbuild ausführen |
| `npm run check` | TypeScript-Typenprüfung (`--noEmit`) |
| `npm run test` | Vitest-Unit-Tests ausführen |
| `npm run test:all` | Nacheinander: `check` → Vitest → `cargo test` innerhalb von `src-tauri` |
| `npm run tauri build` | Release-Pakete erzeugen (siehe `tauri.conf.json`) |
| `npm run icons` | `src-tauri/icons` aus `./logo.png` neu erzeugen |

Windows-Paketierung (Installer + portable EXE, `CARGO_TARGET_DIR`, Aufräumarbeiten nach dem Build): siehe [`docs/打包说明.md`](./docs/打包说明.md).

---

## Repository-Struktur

| Pfad | Rolle |
|------|-------|
| `src/` | Frontend-TypeScript (Editor, i18n, Einstellungen, Renderer) |
| `src-tauri/` | Rust-Crate + `tauri.conf.json` |
| `docs/` | Produktspezifikation (`开发方案讨论稿.md`), Entwicklungslog, detailliertes Handbuch |
| `使用手册.md` | Kurzes Handbuch für Endnutzer (Chinesisch) |
| `public/` | Statische Assets, die von Vite bereitgestellt werden (z. B. `logo.png` für die Titelleiste) |

---

## Dokumentationsindex

| Dokument | Zielgruppe |
|----------|------------|
| [使用手册.md](./使用手册.md) | Endnutzer (Chinesisch, kurz gefasst) |
| [docs/启动与使用手册.md](./docs/启动与使用手册.md) | Nutzer + Mitwirkende (detailliert) |
| [RUN.md](./RUN.md) | Tipps für den schnellen Start und Cargo-Spiegelserver |
| [docs/打包说明.md](./docs/打包说明.md) | Maintainer der Windows-Paketierung (Batch-Skripte, Aufräumen, Pfade) |
| [docs/开发方案讨论稿.md](./docs/开发方案讨论稿.md) | Architektur & Roadmap |
| [docs/开发日志.md](./docs/开发日志.md) | Änderungsprotokoll / Entscheidungen |

---

## Mitwirken

Führe vor dem Einreichen von Änderungen `npm run test:all` aus. Halte dich an den bestehenden Code-Stil und beschränke Diffs auf das Notwendige für die jeweilige Aufgabe.
