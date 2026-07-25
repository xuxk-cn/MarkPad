import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  // Vite 开发服务器配置 — Tauri 不使用它的端口，仅用于 HMR
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 忽略 src-tauri 目录，避免 Rust 编译触发前端重载
      ignored: ["**/src-tauri/**"],
    },
  },
  // 生产构建：tsc 先检查类型，vite 打包
  build: {
    target: "es2020",
    minify: "esbuild",
    sourcemap: false,
    // 减小包体：不内联资源
    assetsInlineLimit: 0,
  },
});