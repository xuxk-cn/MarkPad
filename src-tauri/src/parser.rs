/// pulldown-cmark 块级解析器
///
/// 使用 pulldown_cmark::Parser::into_offset_iter() 获得每个 Event 的字节偏移，
/// 将 Start Tag 映射为 Block 块级元素返回给前端。
use pulldown_cmark::{Event, Options, Parser, Tag, TagEnd};
use serde::Serialize;

/// 块级 AST 节点 — 序列化后传给前端
#[derive(Debug, Clone, Serialize)]
pub struct Block {
    /// 块起始字节偏移（在原始 Markdown 文本中的位置）
    pub start: usize,
    /// 块结束字节偏移
    pub end: usize,
    /// 块类型
    pub kind: BlockKind,
    /// 块的文本内容（去除了标记符号）
    pub text: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum BlockKind {
    Heading { level: u8 },
    Paragraph,
    CodeBlock { lang: Option<String> },
    BlockQuote,
    ListItem { ordered: bool },
    ThematicBreak,
    BlankLine,
}

/// 解析 Markdown 文本，按块级元素分块返回
///
/// pulldown-cmark 的 into_offset_iter() 返回每个事件的字节 span。
/// 我们筛选出块级 Start 事件，记录其偏移范围作为 Block。
pub fn parse_blocks(md: &str) -> Vec<Block> {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);

    let parser = Parser::new_ext(md, options).into_offset_iter();
    let mut blocks: Vec<Block> = Vec::new();
    let mut heading_levels: Vec<u8> = Vec::new();

    for (event, range) in parser {
        match event {
            // ── 块级 Start 事件 ──
            Event::Start(Tag::Heading { level, .. }) => {
                heading_levels.push(level as u8);
                let text = extract_block_text(md, range.clone());
                blocks.push(Block {
                    start: range.start,
                    end: range.end,
                    kind: BlockKind::Heading { level: level as u8 },
                    text,
                });
            }
            Event::Start(Tag::Paragraph) => {
                let text = extract_block_text(md, range.clone());
                if text.trim().is_empty() {
                    blocks.push(Block {
                        start: range.start,
                        end: range.end,
                        kind: BlockKind::BlankLine,
                        text,
                    });
                } else {
                    blocks.push(Block {
                        start: range.start,
                        end: range.end,
                        kind: BlockKind::Paragraph,
                        text,
                    });
                }
            }
            Event::Start(Tag::CodeBlock(kind)) => {
                let lang = match &kind {
                    pulldown_cmark::CodeBlockKind::Fenced(s) => {
                        if s.is_empty() { None } else { Some(s.to_string()) }
                    }
                    pulldown_cmark::CodeBlockKind::Indented => None,
                };
                let text = extract_block_text(md, range.clone());
                blocks.push(Block {
                    start: range.start,
                    end: range.end,
                    kind: BlockKind::CodeBlock { lang },
                    text,
                });
            }
            Event::Start(Tag::BlockQuote(_)) => {
                let text = extract_block_text(md, range.clone());
                blocks.push(Block {
                    start: range.start,
                    end: range.end,
                    kind: BlockKind::BlockQuote,
                    text,
                });
            }
            Event::Start(Tag::Item) => {
                let text = extract_block_text(md, range.clone());
                // 判断 ordered: 简单检查文本是否以数字开头
                let ordered = text.trim_start().starts_with(|c: char| c.is_ascii_digit());
                blocks.push(Block {
                    start: range.start,
                    end: range.end,
                    kind: BlockKind::ListItem { ordered },
                    text,
                });
            }
            Event::Rule => {
                blocks.push(Block {
                    start: range.start,
                    end: range.end,
                    kind: BlockKind::ThematicBreak,
                    text: String::from("---"),
                });
            }

            // ── End 事件：弹出跟踪栈 ──
            Event::End(TagEnd::Heading(_)) => {
                heading_levels.pop();
            }
            _ => {}
        }
    }

    blocks
}

/// 从原始 Markdown 文本中提取 [start..end) 范围的内容
fn extract_block_text(md: &str, range: std::ops::Range<usize>) -> String {
    // 确保在字符边界上截取（pulldown-cmark 的 offset 是字节偏移）
    let end = range.end.min(md.len());
    let start = range.start.min(end);
    md[start..end].to_string()
}