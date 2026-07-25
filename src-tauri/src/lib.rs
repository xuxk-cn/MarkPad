mod file_io;
mod parser;
mod search;
mod startup_open;

use std::sync::Mutex;
use ropey::Rope;
use tauri::State;
use std::path::PathBuf;

// ── Document State ──────────────────────────────────────────────────────────

/// 全局文档状态 — Rope 是「单一事实源」
pub struct DocumentState {
    pub rope: Rope,
}

impl DocumentState {
    pub fn new() -> Self {
        Self { rope: Rope::new() }
    }

    pub fn insert(&mut self, offset: usize, text: &str) {
        if offset <= self.rope.len_chars() {
            self.rope.insert(offset, text);
        }
    }

    pub fn delete(&mut self, start: usize, end: usize) {
        if end <= self.rope.len_chars() && start < end {
            self.rope.remove(start..end);
        }
    }

    pub fn set_all(&mut self, text: &str) {
        self.rope = Rope::from_str(text);
    }

    pub fn get_all_text(&self) -> String {
        self.rope.to_string()
    }

    pub fn len(&self) -> usize {
        self.rope.len_chars()
    }
}

pub type Document = Mutex<DocumentState>;

// ── Tauri Commands ───────────────────────────────────────────────────────────

#[tauri::command]
fn text_insert(state: State<Document>, offset: usize, text: String) -> Result<usize, String> {
    let mut doc = state.lock().map_err(|e| e.to_string())?;
    doc.insert(offset, &text);
    Ok(doc.len())
}

#[tauri::command]
fn text_delete(state: State<Document>, start: usize, end: usize) -> Result<usize, String> {
    let mut doc = state.lock().map_err(|e| e.to_string())?;
    doc.delete(start, end);
    Ok(doc.len())
}

#[tauri::command]
fn text_set_all(state: State<Document>, text: String) -> Result<usize, String> {
    let mut doc = state.lock().map_err(|e| e.to_string())?;
    doc.set_all(&text);
    Ok(doc.len())
}

#[tauri::command]
fn text_get_all(state: State<Document>) -> Result<String, String> {
    let doc = state.lock().map_err(|e| e.to_string())?;
    Ok(doc.get_all_text())
}

#[tauri::command]
fn parse_blocks(state: State<Document>) -> Result<Vec<parser::Block>, String> {
    let doc = state.lock().map_err(|e| e.to_string())?;
    let text = doc.get_all_text();
    Ok(parser::parse_blocks(&text))
}

/// 在当前文档中搜索子串（UTF-8 语义），返回命中列表（开发方案 §6）
#[tauri::command]
fn doc_search(
    state: State<Document>,
    query: String,
    max_results: Option<usize>,
) -> Result<Vec<search::SearchHit>, String> {
    let doc = state.lock().map_err(|e| e.to_string())?;
    let text = doc.get_all_text();
    let cap = max_results.unwrap_or(200).min(2000);
    Ok(search::search_document(&text, &query, cap))
}

// ── Phase 1: 文件 I/O 命令 ─────────────────────────────────────────────────

/// 原生文件打开对话框 → 读取内容 → 写入 Rope → 返回 JSON [path, content]
#[tauri::command]
fn file_open_dialog(app: tauri::AppHandle, state: State<Document>) -> Result<Option<String>, String> {
    let result = file_io::open_file_dialog(&app)?;
    if let Some(ref json) = result {
        // 解析出 content，写入 Rope
        let parsed: (String, String) = serde_json::from_str(json).unwrap();
        let mut doc = state.lock().map_err(|e| e.to_string())?;
        doc.set_all(&parsed.1);

        // 记录当前文件路径
        *file_io::CURRENT_FILE.lock().unwrap() = Some(PathBuf::from(&parsed.0));
    }
    Ok(result)
}

/// 原生文件保存对话框 → 返回路径
#[tauri::command]
fn file_save_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    file_io::save_file_dialog(&app)
}

/// 保存文件：从 Rope 读取内容 → 写入磁盘
#[tauri::command]
fn file_save(state: State<Document>, path: String) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);
    let doc = state.lock().map_err(|e| e.to_string())?;
    file_io::write_file(&path_buf, &doc.rope)?;
    *file_io::CURRENT_FILE.lock().unwrap() = Some(path_buf);
    Ok(())
}

/// 自动保存：若已关联磁盘路径，将当前 Rope 写入该文件（前端防抖后调用）
#[tauri::command]
fn file_auto_save(state: State<Document>) -> Result<bool, String> {
    let path = file_io::CURRENT_FILE.lock().unwrap().clone();
    match path {
        Some(p) => {
            let doc = state.lock().map_err(|e| e.to_string())?;
            file_io::write_file(&p, &doc.rope)?;
            Ok(true)
        }
        None => Ok(false),
    }
}

/// 获取当前文件路径
#[tauri::command]
fn file_current_path() -> Result<Option<String>, String> {
    let guard = file_io::CURRENT_FILE.lock().unwrap();
    Ok(guard.as_ref().map(|p| p.to_string_lossy().to_string()))
}

/// 新建空白文档：清空 Rope 并解除当前文件关联
#[tauri::command]
fn file_new(state: State<Document>) -> Result<(), String> {
    let mut doc = state.lock().map_err(|e| e.to_string())?;
    doc.set_all("");
    *file_io::CURRENT_FILE.lock().unwrap() = None;
    Ok(())
}

/// 打开磁盘上指定路径（最近文件），写入 Rope 并返回文件内容
#[tauri::command]
fn file_open_path(state: State<Document>, path: String) -> Result<String, String> {
    let path_buf = PathBuf::from(&path);
    let content = file_io::read_open_path(&path_buf)?;
    let mut doc = state.lock().map_err(|e| e.to_string())?;
    doc.set_all(&content);
    *file_io::CURRENT_FILE.lock().unwrap() = Some(path_buf);
    Ok(content)
}

// ── App Runner ───────────────────────────────────────────────────────────────

pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(Document::new(DocumentState::new()))
        .manage(startup_open::StartupOpenQueue(std::sync::Mutex::new(vec![])))
        .setup(|app| {
            #[cfg(any(windows, target_os = "linux"))]
            {
                let paths = startup_open::collect_paths_from_args();
                startup_open::ingest_open_paths(app.handle(), paths, false);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            text_insert,
            text_delete,
            text_set_all,
            text_get_all,
            parse_blocks,
            doc_search,
            file_open_dialog,
            file_save_dialog,
            file_save,
            file_auto_save,
            file_current_path,
            file_new,
            file_open_path,
            startup_open::take_startup_open_path,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    #[allow(unused_variables)]
    app.run(|app_handle, event| {
        #[cfg(any(target_os = "macos", target_os = "ios"))]
        if let tauri::RunEvent::Opened { urls } = event {
            let paths: Vec<std::path::PathBuf> = urls
                .into_iter()
                .filter_map(|u| u.to_file_path().ok())
                .collect();
            startup_open::ingest_open_paths(app_handle, paths, true);
        }
    });
}