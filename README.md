# MarkPad

面向 Windows 的轻量级 **Markdown** 桌面编辑器，基于 **Tauri v2**（Rust + WebView2）和精简的 **TypeScript** 前端（Vite，不依赖 React/Vue）。

🌐 **Languages:** 中文 | [English](./README.en.md) | [Deutsch](./README.de.md) | [Français](./README.fr.md) | [Italiano](./README.it.md) | [Español](./README.es.md)

**中文说明**：面向用户的操作步骤见根目录 **[使用手册.md](./使用手册.md)**；开发与排障见 **[docs/启动与使用手册.md](./docs/启动与使用手册.md)** 与 **[RUN.md](./RUN.md)**。

---

## 功能特性

- **单页编辑体验** — Markdown 源码之上叠加只读预览层（Typora 风格），无需左右分栏预览。
- **Rust `ropey` 文档模型** — 单一数据源，编辑器变更经防抖 IPC 同步到后端。
- **Obsidian 风格自动保存** — 绑定文件路径后，空闲 ~1.2s 写入磁盘，另加 30s 安全计时器兜底。
- **文档内查找** — `Ctrl+F`，搜索逻辑由 Rust 后端提供。
- **设置项** — 明暗主题、中/英界面语言、编辑器内 **Ctrl + 鼠标滚轮** 字体缩放。
- **右键菜单** — 插入常用片段（脚注、表格、Callout、分隔线、围栏代码块、数学块）以及行内格式。

---

## 运行环境要求

- **Windows** 10/11，并安装 **WebView2**（Win11 自带；Win10 可能需要手动安装 [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)）。
- **Node.js** ≥ 18
- **Rust** stable（通过 `rustup` 安装）

---

## 快速开始

克隆仓库后，在 PowerShell 中执行：

```powershell
cd markpad
npm install
npm run tauri dev
```

首次构建 Rust 端可能需要数分钟。

---

## NPM 脚本

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

---

## 仓库结构

| 路径 | 作用 |
|------|------|
| `src/` | 前端 TypeScript（编辑器、i18n、设置、渲染器等） |
| `src-tauri/` | Rust crate 代码 + `tauri.conf.json` |
| `docs/` | 产品方案（`开发方案讨论稿.md`）、开发日志、详细手册 |
| `使用手册.md` | 面向最终用户的简明手册（中文） |
| `public/` | Vite 托管的静态资源（如标题栏使用的 `logo.png`） |

---

## 文档索引

| 文档 | 面向读者 |
|------|----------|
| [使用手册.md](./使用手册.md) | 最终用户（中文，简明） |
| [docs/启动与使用手册.md](./docs/启动与使用手册.md) | 使用者 + 贡献者（详细） |
| [RUN.md](./RUN.md) | 快速启动提示，含 cargo 镜像配置建议 |
| [docs/打包说明.md](./docs/打包说明.md) | 打包维护者（批处理脚本、产物清理、路径说明） |
| [docs/开发方案讨论稿.md](./docs/开发方案讨论稿.md) | 架构与路线图 |
| [docs/开发日志.md](./docs/开发日志.md) | 变更记录与决策历史 |

---

## 贡献

提交变更前请先运行 `npm run test:all`，并保持代码风格与仓库一致，提交只包含与当前任务直接相关的改动。
