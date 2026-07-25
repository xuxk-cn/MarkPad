# MarkPad 运行步骤

项目简介与脚本说明见根目录 **[README.md](./README.md)**；面向用户的简明操作见 **[使用手册.md](./使用手册.md)**。更完整的功能说明、快捷键与开发者命令见 **`docs/启动与使用手册.md`**。

## 环境要求

- Node.js ≥ 18（当前：v24.11.1 ✓）
- Rust stable（当前：1.94.1 ✓）
- Windows 10/11（WebView2 已内置）

## 首次运行

在 **Windows PowerShell** 中执行：

```powershell
cd E:\projects\MarkPad
npm install
npm run tauri dev
```

第一条安装前端依赖（`@tauri-apps/api`、`@tauri-apps/cli`、`typescript`、`vite`）。

第二条启动开发模式：
1. 先编译 Rust 后端（首次较慢，约 2-5 分钟下载并编译所有 crate）
2. 再启动 Vite 前端开发服务器（`http://localhost:1420`）
3. 最后打开 MarkPad 窗口

首次 Rust 编译会下载依赖（tauri、serde、ropey、pulldown-cmark 等），预计 200-300 个 crate，需要等一会儿。

## 预期结果

弹出一个 **MarkPad** 窗口：标题栏左侧为 Logo 与文件名，右侧为「打开 / 保存」等，下方为 **Markdown 一体化编辑区**（底层源码 + 叠加层所见即所得）。关闭窗口即可退出。Logo 静态资源为 `public/logo.png`（与根目录 `logo.png` 同步维护即可）。

常用脚本：

- `npm run check` — TypeScript 检查  
- `npm run test` — 前端单元测试（Vitest）  
- `npm run test:all` — `check` + 前端测试 + `cargo test`  
- `npm run bench` — Rust `perf_10k` 基准（需在 `src-tauri` 下能成功 `cargo bench`）

## 可能的问题

### 1. cargo 下载慢

设置国内镜像：

```powershell
$env:CARGO_HOME = "$env:USERPROFILE\.cargo"
```

在 `C:\Users\你的用户名\.cargo\config.toml` 添加：

```toml
[source.crates-io]
replace-with = 'tuna'

[source.tuna]
registry = "https://mirrors.tuna.tsinghua.edu.cn/git/crates.io-index.git"
```

### 2. WebView2 未找到

Win10 个别版本需手动安装 [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)。Win11 已有。

### 3. Vite 端口 1420 被占用

修改 `vite.config.ts` 中的 `port` 和 `src-tauri/tauri.conf.json` 中的 `devUrl`，保持两者一致。