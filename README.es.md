# MarkPad

Editor de escritorio **Markdown** ligero para Windows, creado con **Tauri v2** (Rust + WebView2) y un front-end **TypeScript** minimalista (Vite, sin React/Vue).

🌐 **Languages:** [中文](./README.md) | [English](./README.en.md) | [Deutsch](./README.de.md) | [Français](./README.fr.md) | [Italiano](./README.it.md) | Español

**Para usuarios chinos:** dispones de una guía breve de uso final en **[使用手册.md](./使用手册.md)**. Para desarrollo y resolución de problemas, consulta **[docs/启动与使用手册.md](./docs/启动与使用手册.md)** y **[RUN.md](./RUN.md)**.

---

## Características

- **Edición en una sola superficie** — fuente Markdown con una capa superpuesta de vista previa de solo lectura (estilo Typora), sin panel de vista previa dividido.
- **Documento Rust `ropey`** — única fuente de verdad; la sincronización desde el editor se realiza mediante IPC con debounce.
- **Guardado automático al estilo Obsidian** — cuando se define una ruta de archivo, los cambios se vuelcan a disco tras ~1,2 s de inactividad, más un temporizador de seguridad de 30 s.
- **Buscar en el documento** — `Ctrl+F`, búsqueda implementada en el backend Rust.
- **Ajustes** — tema claro/oscuro, interfaz en chino/inglés, zoom de fuente en el editor con **Ctrl + rueda del ratón**.
- **Menú contextual** — insertar fragmentos (nota al pie, tabla, callout, línea horizontal, bloque de código con cercas, bloque matemático) y formato en línea.

---

## Requisitos

- **Windows** 10/11 con **WebView2** (incluido en Win11; Win10 puede necesitar la instalación manual de [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)).
- **Node.js** ≥ 18
- **Rust** estable (instalado a través de `rustup`)

---

## Inicio rápido

Clona este repositorio y luego ejecuta en PowerShell:

```powershell
cd markpad
npm install
npm run tauri dev
```

La primera compilación Rust puede tardar varios minutos.

---

## Scripts NPM

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

---

## Estructura del repositorio

| Ruta | Rol |
|------|-----|
| `src/` | TypeScript del front-end (editor, i18n, ajustes, renderizador) |
| `src-tauri/` | Crate Rust + `tauri.conf.json` |
| `docs/` | Especificación de producto (`开发方案讨论稿.md`), registro de desarrollo, manual detallado |
| `使用手册.md` | Manual breve para el usuario final (en chino) |
| `public/` | Recursos estáticos servidos por Vite (ej. `logo.png` para la barra de título) |

---

## Índice de documentación

| Documento | Audiencia |
|-----------|-----------|
| [使用手册.md](./使用手册.md) | Usuarios finales (chino, conciso) |
| [docs/启动与使用手册.md](./docs/启动与使用手册.md) | Usuarios + colaboradores (detallado) |
| [RUN.md](./RUN.md) | Consejos de arranque rápido y configuración del mirror de Cargo |
| [docs/打包说明.md](./docs/打包说明.md) | Mantenedores del empaquetado Windows (scripts batch, limpieza, rutas) |
| [docs/开发方案讨论稿.md](./docs/开发方案讨论稿.md) | Arquitectura & hoja de ruta |
| [docs/开发日志.md](./docs/开发日志.md) | Registro de cambios / decisiones |

---

## Contribuciones

Antes de enviar cambios, ejecuta `npm run test:all`. Respeta el estilo de código existente y mantén los diffs centrados en la tarea.
