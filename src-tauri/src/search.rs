//! 单文档内搜索 — 在 Rope 全文上扫描（开发方案 §6 MVP）

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct SearchHit {
    /// 从 0 起的行号（按 `\n` 分段）
    pub line: usize,
    /// 匹配起点在全文中的 UTF-8 字节偏移
    pub byte_offset: usize,
}

/// 非重叠查找；`query` 为空则返回空列表
pub fn search_document(text: &str, query: &str, max_results: usize) -> Vec<SearchHit> {
    if query.is_empty() || max_results == 0 {
        return Vec::new();
    }

    let mut hits = Vec::new();
    let mut search_from = 0usize;

    while hits.len() < max_results && search_from < text.len() {
        let rest = &text[search_from..];
        let Some(rel) = rest.find(query) else {
            break;
        };
        let abs = search_from + rel;
        let line = text[..abs].chars().filter(|&c| c == '\n').count();
        hits.push(SearchHit {
            line,
            byte_offset: abs,
        });
        let step = query.len().max(1);
        search_from = abs + step;
    }

    hits
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_query_returns_nothing() {
        assert!(search_document("hello\nworld", "", 10).is_empty());
    }

    #[test]
    fn zero_max_returns_nothing() {
        assert!(search_document("abc", "a", 0).is_empty());
    }

    #[test]
    fn finds_ascii_and_line() {
        let h = search_document("a\nb\nc", "b", 10);
        assert_eq!(h.len(), 1);
        assert_eq!(h[0].line, 1);
        assert_eq!(h[0].byte_offset, 2);
    }

    #[test]
    fn utf8_multibyte_line_count() {
        let text = "第一行\n第二行\nneedle";
        let h = search_document(text, "needle", 5);
        assert_eq!(h.len(), 1);
        assert_eq!(h[0].line, 2);
    }

    #[test]
    fn non_overlapping_hits() {
        let h = search_document("aaa", "a", 10);
        assert_eq!(h.len(), 3);
        assert_eq!(h[0].byte_offset, 0);
        assert_eq!(h[1].byte_offset, 1);
        assert_eq!(h[2].byte_offset, 2);
    }
}
