# MarkPad

🌐 **Languages:** [中文](#中文) | [English](#english) | [Deutsch](#deutsch) | [Français](#français) | [Italiano](#italiano) | [Español](#español)

---

## 中文

面向 Windows 的轻量级 **Markdown** 桌面编辑器，基于 **Tauri v2**（Rust + WebView2）和精简的 **TypeScript** 前端（Vite，不依赖 React/Vue）。

**中文说明**：面向用户的操作步骤见根目录 **[使用手册.md](./使用手册.md)**；开发与排障见 **[docs/启动与使用手册.md](./docs/启动与使用手册.md)** 与 **[RUN.md](./RUN.md)**。

### 功能特性

- **单页编辑体验** — Markdown 源码之上叠加只读预览层（Typora 风格），无需左右分栏预览。
- **Rust `ropey` 文档模型** — 单一数据源，编辑器变更经防抖 IPC 同步到后端。
- **Obsidian 风格自动保存** — 绑定文件路径后，空闲 ~1.2s 写入磁盘，另加 30s 安全计时器兜底。
- **文档内查找** — `Ctrl+F`，搜索逻辑由 Rust 后端提供。
- **设置项** — 明暗主题、中/英界面语言、编辑器内 **Ctrl + 鼠标滚轮** 字体缩放。
- **右键菜单** — 插入常用片段（脚注、表格、Callout、分隔线、围栏代码块、数学块）以及行内格式。

### 运行环境要求

- **Windows** 10/11，并安装 **WebView2**（Win11 自带；Win10 可能需要手动安装 [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)）。
- **Node.js** ≥ 18
- **Rust** stable（通过 `rustup` 安装）

### 快速开始

克隆仓库后，在 PowerShell 中执行：

```powershell
cd markpad
npm install
npm run tauri dev
```

首次构建 Rust 端可能需要数分钟。

### NPM 脚本

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 仅启动 Vite 开发服务器（浏览器预览，不含 Tauri 窗口） |
| `npm run tauri dev` | 启动完整的 Tauri 应用 |
| `npm run build` | 执行 `tsc` + Vite 生产构建 |
| `npm run check` | TypeScript 类型检查（`--noEmit`） |
| `npm run test` | 运行 Vitest 单元测试 |
| `npm run test:all` | 依次执行 `check` → Vitest → `src-tauri` 内的 `cargo test` |
| `npm run tauri build` | 生成发布包（详见 `tauri.conf.json`） |
| `npm run icons` | 从 `./logo.png` 重新生成 `src-tauri/icons` 图标集 |

Windows 打包（安装器 + 免安装 exe、`CARGO_TARGET_DIR` 环境变量、构建后产物清理）：参见 [`docs/打包说明.md`](./docs/打包说明.md)。

### 仓库结构

| 路径 | 作用 |
|------|------|
| `src/` | 前端 TypeScript（编辑器、i18n、设置、渲染器等） |
| `src-tauri/` | Rust crate 代码 + `tauri.conf.json` |
| `docs/` | 产品方案（`开发方案讨论稿.md`）、开发日志、详细手册 |
| `使用手册.md` | 面向最终用户的简明手册（中文） |
| `public/` | Vite 托管的静态资源（如标题栏使用的 `logo.png`） |

### 文档索引

| 文档 | 面向读者 |
|------|----------|
| [使用手册.md](./使用手册.md) | 最终用户（中文，简明） |
| [docs/启动与使用手册.md](./docs/启动与使用手册.md) | 使用者 + 贡献者（详细） |
| [RUN.md](./RUN.md) | 快速启动提示，含 cargo 镜像配置建议 |
| [docs/打包说明.md](./docs/打包说明.md) | 打包维护者（批处理脚本、产物清理、路径说明） |
| [docs/开发方案讨论稿.md](./docs/开发方案讨论稿.md) | 架构与路线图 |
| [docs/开发日志.md](./docs/开发日志.md) | 变更记录与决策历史 |

### 贡献

提交变更前请先运行 `npm run test:all`，并保持代码风格与仓库一致，提交只包含与当前任务直接相关的改动。

---

## English

Lightweight **Markdown** desktop editor for Windows, built with **Tauri v2** (Rust + WebView2) and a small **TypeScript** front end (Vite, no React/Vue shell).

**For Chinese users:** end-user instructions are available in **[使用手册.md](./使用手册.md)** (concise). For development & troubleshooting see **[docs/启动与使用手册.md](./docs/启动与使用手册.md)** and **[RUN.md](./RUN.md)**.

### Features

- **Single-surface editing** — Markdown source with a read-only preview overlay (Typora-like), no split preview pane.
- **Rust `ropey` document** — single source of truth; syncs from the editor with debounced IPC.
- **Obsidian-style auto-save** — when a file path is set, changes flush to disk after ~1.2s idle plus a 30s safety timer.
- **Find in document** — `Ctrl+F`, Rust-backed search.
- **Settings** — light/dark theme, Chinese/English UI, **Ctrl + mouse wheel** font zoom in the editor.
- **Context menu** — insert snippets (footnote, table, callout, HR, fenced code, math block) and inline formatting.

### Requirements

- **Windows** 10/11 with **WebView2** (bundled on Win11; Win10 may need [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)).
- **Node.js** ≥ 18
- **Rust** stable (`rustup`)

### Quick start

Clone this repository, then run:

```powershell
cd markpad
npm install
npm run tauri dev
```

The first Rust build can take several minutes.

### NPM scripts

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

### Repository layout

| Path | Role |
|------|------|
| `src/` | Front-end TypeScript (editor, i18n, settings, renderer) |
| `src-tauri/` | Rust crate + `tauri.conf.json` |
| `docs/` | Product spec (`开发方案讨论稿.md`), dev log, detailed manual |
| `使用手册.md` | Short end-user manual (Chinese) |
| `public/` | Static assets served by Vite (e.g. `logo.png` for the title bar) |

### Documentation index

| Document | Audience |
|----------|----------|
| [使用手册.md](./使用手册.md) | End users (Chinese, concise) |
| [docs/启动与使用手册.md](./docs/启动与使用手册.md) | Users + contributors (detailed) |
| [RUN.md](./RUN.md) | Fast run & cargo mirror tips |
| [docs/打包说明.md](./docs/打包说明.md) | Windows release packaging (batch scripts, cleanup, paths) |
| [docs/开发方案讨论稿.md](./docs/开发方案讨论稿.md) | Architecture & roadmap |
| [docs/开发日志.md](./docs/开发日志.md) | Change log / decisions |

### Contributing

Run `npm run test:all` before submitting changes. Match existing code style; keep diffs focused on the task.

---

## Deutsch

Leichtgewichtiger **Markdown**-Desktop-Editor für Windows, erstellt mit **Tauri v2** (Rust + WebView2) und einem schlanken **TypeScript**-Frontend (Vite, ohne React/Vue).

**Hinweis für chinesische Benutzer:** Eine kurze Bedienungsanleitung für Endnutzer liegt unter **[使用手册.md](./使用手册.md)**. Für Entwicklung und Fehlerbehebung siehe **[docs/启动与使用手册.md](./docs/启动与使用手册.md)** und **[RUN.md](./RUN.md)**.

### Funktionen

- **Einzeloberflächen-Bearbeitung** — Markdown-Quelltext mit überlagerter schreibgeschützter Vorschau (ähnlich Typora), ohne geteiltes Vorschaufenster.
- **Rust `ropey`-Dokumentmodell** — Single Source of Truth; Synchronisation vom Editor über entprelltes IPC.
- **Obsidian-ähnliches automatisches Speichern** — sobald ein Dateipfad gesetzt ist, werden Änderungen nach ~1,2 s Inaktivität und zusätzlich über einen 30-Sekunden-Sicherheitstimer auf die Festplatte geschrieben.
- **Im Dokument suchen** — `Strg+F`, Suche auf Rust-Backend basierend.
- **Einstellungen** — helles/dunkles Theme, Benutzeroberfläche Chinesisch/Englisch, Schriftgröße im Editor per **Strg + Mausrad**.
- **Kontextmenü** — Einfügen von Bausteinen (Fußnote, Tabelle, Callout, Trennlinie, Codeblock mit Zaun, Mathematikblock) sowie Inline-Formatierungen.

### Voraussetzungen

- **Windows** 10/11 mit **WebView2** (bei Win11 vorinstalliert; Win10 benötigt ggf. die manuelle Installation der [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)).
- **Node.js** ≥ 18
- **Rust** stable (installiert über `rustup`)

### Schnellstart

Repository klonen und in PowerShell ausführen:

```powershell
cd markpad
npm install
npm run tauri dev
```

Der erste Rust-Build kann mehrere Minuten dauern.

### NPM-Skripte

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

### Repository-Struktur

| Pfad | Rolle |
|------|-------|
| `src/` | Frontend-TypeScript (Editor, i18n, Einstellungen, Renderer) |
| `src-tauri/` | Rust-Crate + `tauri.conf.json` |
| `docs/` | Produktspezifikation (`开发方案讨论稿.md`), Entwicklungslog, detailliertes Handbuch |
| `使用手册.md` | Kurzes Handbuch für Endnutzer (Chinesisch) |
| `public/` | Statische Assets, die von Vite bereitgestellt werden (z. B. `logo.png` für die Titelleiste) |

### Dokumentationsindex

| Dokument | Zielgruppe |
|----------|------------|
| [使用手册.md](./使用手册.md) | Endnutzer (Chinesisch, kurz gefasst) |
| [docs/启动与使用手册.md](./docs/启动与使用手册.md) | Nutzer + Mitwirkende (detailliert) |
| [RUN.md](./RUN.md) | Tipps für den schnellen Start und Cargo-Spiegelserver |
| [docs/打包说明.md](./docs/打包说明.md) | Maintainer der Windows-Paketierung (Batch-Skripte, Aufräumen, Pfade) |
| [docs/开发方案讨论稿.md](./docs/开发方案讨论稿.md) | Architektur & Roadmap |
| [docs/开发日志.md](./docs/开发日志.md) | Änderungsprotokoll / Entscheidungen |

### Mitwirken

Führe vor dem Einreichen von Änderungen `npm run test:all` aus. Halte dich an den bestehenden Code-Stil und beschränke Diffs auf das Notwendige für die jeweilige Aufgabe.

---

## Français

Éditeur de bureau **Markdown** léger pour Windows, construit avec **Tauri v2** (Rust + WebView2) et un front-end **TypeScript** minimaliste (Vite, sans React/Vue).

**Pour les utilisateurs chinois :** un guide d'utilisation concis est disponible dans **[使用手册.md](./使用手册.md)**. Pour le développement et le dépannage, référez-vous à **[docs/启动与使用手册.md](./docs/启动与使用手册.md)** et **[RUN.md](./RUN.md)**.

### Fonctionnalités

- **Édition sur une seule surface** — source Markdown avec une superposition de prévisualisation en lecture seule (style Typora), sans panneau de prévisualisation scindé.
- **Document Rust `ropey`** — source unique de vérité ; synchronisation depuis l'éditeur via IPC avec anti-rebond.
- **Sauvegarde automatique façon Obsidian** — une fois le chemin du fichier défini, les modifications sont écrites sur disque après ~1,2 s d'inactivité, plus une sécurité toutes les 30 s.
- **Rechercher dans le document** — `Ctrl+F`, recherche reposant sur le backend Rust.
- **Paramètres** — thème clair/sombre, interface en chinois/anglais, zoom de la police dans l'éditeur avec **Ctrl + molette de la souris**.
- **Menu contextuel** — insertion d'extraits (note de bas de page, tableau, callout, séparateur horizontal, bloc de code clôturé, bloc mathématique) et formatage en ligne.

### Prérequis

- **Windows** 10/11 avec **WebView2** (livré avec Win11 ; Win10 nécessite éventuellement une installation manuelle du [runtime WebView2](https://developer.microsoft.com/microsoft-edge/webview2/)).
- **Node.js** ≥ 18
- **Rust** stable (installé via `rustup`)

### Démarrage rapide

Clonez ce dépôt puis exécutez dans PowerShell :

```powershell
cd markpad
npm install
npm run tauri dev
```

La première compilation Rust peut prendre plusieurs minutes.

### Scripts NPM

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarrer uniquement le serveur de développement Vite (prévisualisation navigateur, sans fenêtre Tauri) |
| `npm run tauri dev` | Démarrer l'application Tauri complète |
| `npm run build` | Exécuter `tsc` + la build de production Vite |
| `npm run check` | Vérification des types TypeScript (`--noEmit`) |
| `npm run test` | Lancer les tests unitaires Vitest |
| `npm run test:all` | Enchaîner `check` → Vitest → `cargo test` dans `src-tauri` |
| `npm run tauri build` | Générer les paquets de distribution (voir `tauri.conf.json`) |
| `npm run icons` | Régénérer `src-tauri/icons` à partir de `./logo.png` |

Packaging Windows (installateurs + EXE portable, `CARGO_TARGET_DIR`, nettoyage post-build) : voir [`docs/打包说明.md`](./docs/打包说明.md).

### Structure du dépôt

| Chemin | Rôle |
|--------|------|
| `src/` | TypeScript côté front-end (éditeur, i18n, paramètres, rendu) |
| `src-tauri/` | Crate Rust + `tauri.conf.json` |
| `docs/` | Spécification produit (`开发方案讨论稿.md`), journal de développement, manuel détaillé |
| `使用手册.md` | Manuel utilisateur concis (chinois) |
| `public/` | Ressources statiques servies par Vite (par exemple `logo.png` pour la barre de titre) |

### Index de la documentation

| Document | Public |
|----------|--------|
| [使用手册.md](./使用手册.md) | Utilisateurs finaux (chinois, concis) |
| [docs/启动与使用手册.md](./docs/启动与使用手册.md) | Utilisateurs + contributeurs (détaillé) |
| [RUN.md](./RUN.md) | Astuces de démarrage rapide et configuration de miroir Cargo |
| [docs/打包说明.md](./docs/打包说明.md) | Mainteneurs packaging Windows (scripts batch, nettoyage, chemins) |
| [docs/开发方案讨论稿.md](./docs/开发方案讨论稿.md) | Architecture & feuille de route |
| [docs/开发日志.md](./docs/开发日志.md) | Journal des changements / décisions |

### Contribuer

Exécutez `npm run test:all` avant de soumettre des modifications. Respectez le style du code existant ; gardez les diffs ciblés sur la tâche en cours.

---

## Italiano

Editor desktop **Markdown** leggero per Windows, basato su **Tauri v2** (Rust + WebView2) e un front-end **TypeScript** snello (Vite, senza React/Vue).

**Per gli utenti cinesi:** una breve guida per l'utente finale è disponibile in **[使用手册.md](./使用手册.md)**. Per lo sviluppo e la risoluzione dei problemi, vedere **[docs/启动与使用手册.md](./docs/启动与使用手册.md)** e **[RUN.md](./RUN.md)**.

### Funzionalità

- **Modifica a superficie singola** — sorgente Markdown con una sovrimpressione di anteprima in sola lettura (stile Typora), senza pannelli di anteprima divisi.
- **Documento Rust `ropey`** — singola fonte di verità; la sincronizzazione dall'editor avviene tramite IPC con debounce.
- **Salvataggio automatico in stile Obsidian** — dopo aver impostato un percorso file, le modifiche vengono scritte su disco dopo ~1,2 s di inattività, più un timer di sicurezza di 30 s.
- **Cerca nel documento** — `Ctrl+F`, ricerca basata sul backend Rust.
- **Impostazioni** — tema chiaro/scuro, interfaccia in cinese/inglese, zoom del font nell'editor con **Ctrl + rotella del mouse**.
- **Menu contestuale** — inserimento di frammenti (nota a piè di pagina, tabella, callout, riga orizzontale, blocco di codice fence, blocco matematico) e formattazione inline.

### Requisiti

- **Windows** 10/11 con **WebView2** (in bundle su Win11; Win10 potrebbe richiedere l'installazione manuale di [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)).
- **Node.js** ≥ 18
- **Rust** stable (installato tramite `rustup`)

### Avvio rapido

Clona la repository, quindi esegui in PowerShell:

```powershell
cd markpad
npm install
npm run tauri dev
```

La prima compilazione Rust può richiedere diversi minuti.

### Script NPM

| Script | Descrizione |
|--------|-------------|
| `npm run dev` | Avvia solo il server di sviluppo Vite (anteprima browser, senza finestra Tauri) |
| `npm run tauri dev` | Avvia l'app Tauri completa |
| `npm run build` | Esegue `tsc` + build di produzione Vite |
| `npm run check` | Controllo dei tipi TypeScript (`--noEmit`) |
| `npm run test` | Esegue i test unitari Vitest |
| `npm run test:all` | Esegue in sequenza `check` → Vitest → `cargo test` in `src-tauri` |
| `npm run tauri build` | Genera i pacchetti di release (vedi `tauri.conf.json`) |
| `npm run icons` | Rigenera `src-tauri/icons` a partire da `./logo.png` |

Packaging Windows (installatori + EXE portatile, `CARGO_TARGET_DIR`, pulizia post-build): vedi [`docs/打包说明.md`](./docs/打包说明.md).

### Struttura della repository

| Percorso | Ruolo |
|----------|-------|
| `src/` | TypeScript front-end (editor, i18n, impostazioni, renderer) |
| `src-tauri/` | Crate Rust + `tauri.conf.json` |
| `docs/` | Specifica prodotto (`开发方案讨论稿.md`), diario di sviluppo, manuale dettagliato |
| `使用手册.md` | Breve manuale per l'utente finale (in cinese) |
| `public/` | Risorse statiche servite da Vite (es. `logo.png` per la barra del titolo) |

### Indice documentazione

| Documento | Pubblico |
|-----------|----------|
| [使用手册.md](./使用手册.md) | Utenti finali (cinese, conciso) |
| [docs/启动与使用手册.md](./docs/启动与使用手册.md) | Utenti + contributori (dettagliato) |
| [RUN.md](./RUN.md) | Suggerimenti di avvio rapido e configurazione mirror Cargo |
| [docs/打包说明.md](./docs/打包说明.md) | Manutentori packaging Windows (script batch, pulizia, percorsi) |
| [docs/开发方案讨论稿.md](./docs/开发方案讨论稿.md) | Architettura & roadmap |
| [docs/开发日志.md](./docs/开发日志.md) | Registro cambiamenti / decisioni |

### Come contribuire

Prima di sottoporre modifiche esegui `npm run test:all`. Mantieni lo stile del codice esistente; mantieni i diff focalizzati sull'attività in corso.

---

## Español

Editor de escritorio **Markdown** ligero para Windows, creado con **Tauri v2** (Rust + WebView2) y un front-end **TypeScript** minimalista (Vite, sin React/Vue).

**Para usuarios chinos:** dispones de una guía breve de uso final en **[使用手册.md](./使用手册.md)**. Para desarrollo y resolución de problemas, consulta **[docs/启动与使用手册.md](./docs/启动与使用手册.md)** y **[RUN.md](./RUN.md)**.

### Características

- **Edición en una sola superficie** — fuente Markdown con una capa superpuesta de vista previa de solo lectura (estilo Typora), sin panel de vista previa dividido.
- **Documento Rust `ropey`** — única fuente de verdad; la sincronización desde el editor se realiza mediante IPC con debounce.
- **Guardado automático al estilo Obsidian** — cuando se define una ruta de archivo, los cambios se vuelcan a disco tras ~1,2 s de inactividad, más un temporizador de seguridad de 30 s.
- **Buscar en el documento** — `Ctrl+F`, búsqueda implementada en el backend Rust.
- **Ajustes** — tema claro/oscuro, interfaz en chino/inglés, zoom de fuente en el editor con **Ctrl + rueda del ratón**.
- **Menú contextual** — insertar fragmentos (nota al pie, tabla, callout, línea horizontal, bloque de código con cercas, bloque matemático) y formato en línea.

### Requisitos

- **Windows** 10/11 con **WebView2** (incluido en Win11; Win10 puede necesitar la instalación manual de [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)).
- **Node.js** ≥ 18
- **Rust** estable (instalado a través de `rustup`)

### Inicio rápido

Clona este repositorio y luego ejecuta en PowerShell:

```powershell
cd markpad
npm install
npm run tauri dev
```

La primera compilación Rust puede tardar varios minutos.

### Scripts NPM

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia solo el servidor de desarrollo Vite (vista previa en navegador, sin ventana Tauri) |
| `npm run tauri dev` | Inicia la aplicación Tauri completa |
| `npm run build` | Ejecuta `tsc` + compilación de producción con Vite |
| `npm run check` | Comprobación de tipos TypeScript (`--noEmit`) |
| `npm run test` | Ejecuta los tests unitarios Vitest |
| `npm run test:all` | Ejecuta en secuencia `check` → Vitest → `cargo test` dentro de `src-tauri` |
| `npm run tauri build` | Genera los paquetes de distribución (véase `tauri.conf.json`) |
| `npm run icons` | Regenera `src-tauri/icons` a partir de `./logo.png` |

Empaquetado en Windows (instaladores + EXE portátil, `CARGO_TARGET_DIR`, limpieza posterior a la compilación): consulta [`docs/打包说明.md`](./docs/打包说明.md).

### Estructura del repositorio

| Ruta | Rol |
|------|-----|
| `src/` | TypeScript del front-end (editor, i18n, ajustes, renderizador) |
| `src-tauri/` | Crate Rust + `tauri.conf.json` |
| `docs/` | Especificación de producto (`开发方案讨论稿.md`), registro de desarrollo, manual detallado |
| `使用手册.md` | Manual breve para el usuario final (en chino) |
| `public/` | Recursos estáticos servidos por Vite (ej. `logo.png` para la barra de título) |

### Índice de documentación

| Documento | Audiencia |
|-----------|-----------|
| [使用手册.md](./使用手册.md) | Usuarios finales (chino, conciso) |
| [docs/启动与使用手册.md](./docs/启动与使用手册.md) | Usuarios + colaboradores (detallado) |
| [RUN.md](./RUN.md) | Consejos de arranque rápido y configuración del mirror de Cargo |
| [docs/打包说明.md](./docs/打包说明.md) | Mantenedores del empaquetado Windows (scripts batch, limpieza, rutas) |
| [docs/开发方案讨论稿.md](./docs/开发方案讨论稿.md) | Arquitectura & hoja de ruta |
| [docs/开发日志.md](./docs/开发日志.md) | Registro de cambios / decisiones |

### Contribuciones

Antes de enviar cambios, ejecuta `npm run test:all`. Respeta el estilo de código existente y mantén los diffs centrados en la tarea.
