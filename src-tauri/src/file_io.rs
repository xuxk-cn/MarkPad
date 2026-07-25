// 文件 I/O 模块 — 打开 / 保存 / 自动保存 + 原生文件对话框
//
// Phase 1 文件管线：
//   打开 → Rust 原生文件对话框 → 读文件 → 写入 Rope → 通知前端渲染
//   保存 → 前端提交 Rope 内容 → Rust 写磁盘

use ropey::Rope;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri_plugin_dialog::DialogExt;

/// 当前打开文件的路径（None 表示未保存的新文档）
pub static CURRENT_FILE: Mutex<Option<PathBuf>> = Mutex::new(None);

/// 从磁盘读取文件内容
pub fn read_file(path: &PathBuf) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| format!("无法读取文件: {}", e))
}

/// 将 Rope 内容写入磁盘
pub fn write_file(path: &PathBuf, rope: &Rope) -> Result<(), String> {
    let text = rope.to_string();
    fs::write(path, &text).map_err(|e| format!("无法保存文件: {}", e))
}

/// 打开文件对话框 — 返回 JSON: [path, content]
pub fn open_file_dialog(app: &tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri::Manager;
    let window = app.get_webview_window("main").ok_or("no window")?;
    let path = window
        .dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown", "txt"])
        .blocking_pick_file();

    match path {
        Some(p) => {
            let path_buf = p.as_path().unwrap().to_path_buf();
            let content = read_file(&path_buf)?;
            Ok(Some(serde_json::to_string(&(&path_buf.to_string_lossy(), &content)).unwrap()))
        }
        None => Ok(None),
    }
}

/// 按路径打开已有文件（最近文件等），读入全文并返回内容
pub fn read_open_path(path: &PathBuf) -> Result<String, String> {
    let meta = fs::metadata(path).map_err(|e| format!("无法访问文件: {}", e))?;
    if !meta.is_file() {
        return Err("路径不是普通文件".into());
    }
    read_file(path)
}

/// 保存文件对话框 — 返回用户选择的路径
pub fn save_file_dialog(app: &tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri::Manager;
    let window = app.get_webview_window("main").ok_or("no window")?;
    let path = window
        .dialog()
        .file()
        .add_filter("Markdown", &["md"])
        .blocking_save_file();

    Ok(path.map(|p| p.as_path().unwrap().to_string_lossy().to_string()))
}
