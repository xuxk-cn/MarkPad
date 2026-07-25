//! 从系统「打开方式」/ 双击文件传入的启动参数或 RunEvent::Opened 中解析待打开路径。

use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

pub struct StartupOpenQueue(pub Mutex<Vec<PathBuf>>);

pub fn is_supported_document(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| {
            matches!(
                e.to_ascii_lowercase().as_str(),
                "md" | "markdown" | "mdown" | "mkd" | "txt"
            )
        })
        .unwrap_or(false)
}

fn arg_to_path(arg: &str) -> Option<PathBuf> {
    let s = arg.trim().trim_matches('"');
    if s.is_empty() || s.starts_with('-') {
        return None;
    }
    if let Ok(url) = url::Url::parse(s) {
        if let Ok(p) = url.to_file_path() {
            return Some(p);
        }
    }
    Some(PathBuf::from(s))
}

/// Windows / Linux：启动时命令行参数中的文件路径
pub fn collect_paths_from_args() -> Vec<PathBuf> {
    std::env::args()
        .skip(1)
        .filter_map(|arg| arg_to_path(&arg))
        .filter(|p| is_supported_document(p))
        .collect()
}

pub fn ingest_open_paths(app: &AppHandle, paths: Vec<PathBuf>, emit_to_frontend: bool) {
    let supported: Vec<PathBuf> = paths
        .into_iter()
        .filter(|p| is_supported_document(p))
        .collect();
    if supported.is_empty() {
        return;
    }

    {
        let state = app.state::<StartupOpenQueue>();
        let mut q = state.0.lock().expect("startup open queue poisoned");
        q.extend(supported.iter().cloned());
    }

    if emit_to_frontend {
        if let Some(p) = supported.last() {
            let path = p.to_string_lossy().into_owned();
            let _ = app.emit("open-file", path);
        }
    }
}

#[tauri::command]
pub fn take_startup_open_path(queue: tauri::State<StartupOpenQueue>) -> Option<String> {
    let mut q = queue.0.lock().ok()?;
    let path = q.drain(..).next()?;
    Some(path.to_string_lossy().into_owned())
}
