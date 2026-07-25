# MarkPad

Editor desktop **Markdown** leggero per Windows, basato su **Tauri v2** (Rust + WebView2) e un front-end **TypeScript** snello (Vite, senza React/Vue).

🌐 **Languages:** [中文](./README.md) | [English](./README.en.md) | [Deutsch](./README.de.md) | [Français](./README.fr.md) | Italiano | [Español](./README.es.md)

**Per gli utenti cinesi:** una breve guida per l'utente finale è disponibile in **[使用手册.md](./使用手册.md)**. Per lo sviluppo e la risoluzione dei problemi, vedere **[docs/启动与使用手册.md](./docs/启动与使用手册.md)** e **[RUN.md](./RUN.md)**.

---

## Funzionalità

- **Modifica a superficie singola** — sorgente Markdown con una sovrimpressione di anteprima in sola lettura (stile Typora), senza pannelli di anteprima divisi.
- **Documento Rust `ropey`** — singola fonte di verità; la sincronizzazione dall'editor avviene tramite IPC con debounce.
- **Salvataggio automatico in stile Obsidian** — dopo aver impostato un percorso file, le modifiche vengono scritte su disco dopo ~1,2 s di inattività, più un timer di sicurezza di 30 s.
- **Cerca nel documento** — `Ctrl+F`, ricerca basata sul backend Rust.
- **Impostazioni** — tema chiaro/scuro, interfaccia in cinese/inglese, zoom del font nell'editor con **Ctrl + rotella del mouse**.
- **Menu contestuale** — inserimento di frammenti (nota a piè di pagina, tabella, callout, riga orizzontale, blocco di codice fence, blocco matematico) e formattazione inline.

---

## Requisiti

- **Windows** 10/11 con **WebView2** (in bundle su Win11; Win10 potrebbe richiedere l'installazione manuale di [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)).
- **Node.js** ≥ 18
- **Rust** stable (installato tramite `rustup`)

---

## Avvio rapido

Clona la repository, quindi esegui in PowerShell:

```powershell
cd markpad
npm install
npm run tauri dev
```

La prima compilazione Rust può richiedere diversi minuti.

---

## Script NPM

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

---

## Struttura della repository

| Percorso | Ruolo |
|----------|-------|
| `src/` | TypeScript front-end (editor, i18n, impostazioni, renderer) |
| `src-tauri/` | Crate Rust + `tauri.conf.json` |
| `docs/` | Specifica prodotto (`开发方案讨论稿.md`), diario di sviluppo, manuale dettagliato |
| `使用手册.md` | Breve manuale per l'utente finale (in cinese) |
| `public/` | Risorse statiche servite da Vite (es. `logo.png` per la barra del titolo) |

---

## Indice documentazione

| Documento | Pubblico |
|-----------|----------|
| [使用手册.md](./使用手册.md) | Utenti finali (cinese, conciso) |
| [docs/启动与使用手册.md](./docs/启动与使用手册.md) | Utenti + contributori (dettagliato) |
| [RUN.md](./RUN.md) | Suggerimenti di avvio rapido e configurazione mirror Cargo |
| [docs/打包说明.md](./docs/打包说明.md) | Manutentori packaging Windows (script batch, pulizia, percorsi) |
| [docs/开发方案讨论稿.md](./docs/开发方案讨论稿.md) | Architettura & roadmap |
| [docs/开发日志.md](./docs/开发日志.md) | Registro cambiamenti / decisioni |

---

## Come contribuire

Prima di sottoporre modifiche esegui `npm run test:all`. Mantieni lo stile del codice esistente; mantieni i diff focalizzati sull'attività in corso.
