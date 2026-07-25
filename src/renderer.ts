/**
 * Markdown → HTML 渲染
 *
 * - `renderBlocksToHtml`：使用 Rust `pulldown-cmark` 块级解析结果（`parse_blocks`）生成叠加层 HTML。
 * - `renderMarkdown`：纯 TS 行级回退（无 Tauri 时或测试用）。
 */

/** 与 `src-tauri/src/parser.rs` 中 `Block` 的 JSON 形状一致 */
export type RustBlock = {
  start: number;
  end: number;
  kind: Record<string, unknown>;
  text: string;
};

/**
 * 将 Rust 返回的块列表渲染为叠加层 HTML
 */
export function renderBlocksToHtml(blocks: RustBlock[]): string {
  if (blocks.length === 0) return "";
  return blocks.map(renderSingleBlockHtml).join("");
}

/** 渲染单个块（供全量或视口切片复用） */
export function renderSingleBlockHtml(b: RustBlock): string {
  const tag = blockKindTag(b.kind);
  switch (tag) {
    case "heading": {
      const level = clampHeadingLevel((b.kind.heading as { level?: number })?.level ?? 1);
      const inner = stripHeadingSource(b.text, level);
      return `<h${level}>${renderInline(inner)}</h${level}>`;
    }
    case "paragraph":
      return `<p>${renderInline(b.text.trimEnd())}</p>`;
    case "code_block": {
      const body = stripFencedCodeBody(b.text);
      return `<pre><code>${escapeHtml(body)}</code></pre>`;
    }
    case "blockquote": {
      const inner = stripBlockquotePrefix(b.text);
      return `<blockquote>${renderInline(inner.trimEnd())}</blockquote>`;
    }
    case "list_item": {
      const inner = stripListItemMarker(b.text);
      return `<li>${renderInline(inner.trimEnd())}</li>`;
    }
    case "thematic_break":
      return "<hr />";
    case "blank_line":
      return "<br />";
    default:
      return `<p>${renderInline(b.text)}</p>`;
  }
}

function blockKindTag(kind: Record<string, unknown>): string | undefined {
  return Object.keys(kind)[0];
}

function clampHeadingLevel(n: number): number {
  if (Number.isNaN(n) || n < 1) return 1;
  if (n > 6) return 6;
  return n;
}

/** 去掉 ATX 标题行里的 `#` 前缀（按 level 截断） */
function stripHeadingSource(raw: string, level: number): string {
  const line = raw.split("\n")[0] ?? "";
  const re = new RegExp(`^#{1,${level}}\\s+`);
  return line.replace(re, "").trimEnd();
}

function stripFencedCodeBody(raw: string): string {
  const s = raw.trimStart();
  if (!s.startsWith("```")) return raw.trimEnd();
  const lines = raw.split("\n");
  if (lines.length < 2) return raw.trimEnd();
  const rest = lines.slice(1);
  if (rest.length && rest[rest.length - 1].trim() === "```") {
    rest.pop();
  }
  return rest.join("\n");
}

function stripBlockquotePrefix(raw: string): string {
  return raw
    .split("\n")
    .map((ln) => ln.replace(/^\s*>\s?/, ""))
    .join("\n");
}

function stripListItemMarker(raw: string): string {
  const lines = raw.split("\n");
  if (lines.length === 0) return raw;
  lines[0] = lines[0].replace(/^\s*[-*+]\s+/, "").replace(/^\s*\d+\.\s+/, "");
  return lines.join("\n");
}

/** 单行 Markdown → 行内 HTML（不含外层包裹） */
function renderSourceLineInner(line: string): string {
  if (line === "") return "<br />";
  return `<span class="md-src">${escapeHtml(line)}</span>`;
}

function renderMarkdownLineInner(line: string, sourceMode: boolean): string {
  if (sourceMode) return renderSourceLineInner(line);
  if (line.trim() === "") return "<br />";
  const atx = line.match(/^(#{1,6})(\s+)(.*)$/);
  if (atx) {
    const level = atx[1].length;
    const body = atx[3];
    return `<span class="md-h md-h${level}">${renderInline(body)}</span>`;
  }
  if (/^[-*+]\s/.test(line)) {
    return `<span class="md-li">${renderInline(line.replace(/^[-*+]\s/, ""))}</span>`;
  }
  if (line.startsWith("> ")) {
    return `<span class="md-bq">${renderInline(line.slice(2))}</span>`;
  }
  if (/^---+\s*$/.test(line.trim())) return '<hr class="md-hr" />';
  return `<span class="md-p">${renderInline(line)}</span>`;
}

/** 解析管道表单元格（要求行首为 `|`，GFM 风格） */
export function splitPipeCells(line: string): string[] | null {
  const t = line.trim();
  if (!t.startsWith("|")) return null;
  const raw = t.endsWith("|") ? t.slice(1, -1) : t.slice(1);
  return raw.split("|").map((c) => c.trim());
}

function isPipeTableRow(line: string): boolean {
  const cells = splitPipeCells(line);
  return cells !== null && cells.length >= 1;
}

function isPipeTableSeparatorRow(line: string): boolean {
  const cells = splitPipeCells(line);
  if (!cells || cells.length === 0) return false;
  return cells.every((c) => /^:?-{2,}:?$/.test(c.trim()));
}

type TableBlock = { lines: string[]; end: number };

function tryParsePipeTableAt(lines: string[], start: number): TableBlock | null {
  if (start >= lines.length - 1) return null;
  if (!isPipeTableRow(lines[start])) return null;
  if (!isPipeTableSeparatorRow(lines[start + 1])) return null;

  const acc: string[] = [lines[start], lines[start + 1]];
  let j = start + 2;
  while (j < lines.length) {
    const line = lines[j];
    if (line.trim() === "") break;
    if (isPipeTableSeparatorRow(line)) break;
    if (!isPipeTableRow(line)) break;
    acc.push(line);
    j++;
  }
  return { lines: acc, end: j };
}

function padTableCells(cells: string[], colCount: number): string[] {
  const c = [...cells];
  while (c.length < colCount) c.push("");
  if (c.length > colCount) return c.slice(0, colCount);
  return c;
}

/** 光标在表内：每行显示完整 Markdown，与透明源码对齐 */
function renderTableSourceLines(rows: string[]): string {
  const parts: string[] = ['<div class="md-table-wrap md-table-wrap--editing" role="table">'];
  rows.forEach((line, i) => {
    const kind = i === 0 ? "head" : i === 1 ? "sep" : "body";
    parts.push(
      `<div class="md-line md-table-line md-table-line--${kind}" role="row">` +
        `<span class="md-table-src">${escapeHtml(line)}</span></div>`,
    );
  });
  parts.push("</div>");
  return parts.join("");
}

/** 光标在表外：Obsidian 式网格（每行高度与源码一致） */
function renderTablePrettyGrid(rows: string[]): string {
  const headerCells = splitPipeCells(rows[0]) ?? [];
  const colCount = Math.max(1, headerCells.length);
  const headHtml = padTableCells(headerCells, colCount)
    .map((c) => `<span class="md-table-cell" role="columnheader">${renderInline(c)}</span>`)
    .join("");
  const sepCells = padTableCells(splitPipeCells(rows[1]) ?? [], colCount);
  const sepHtml = sepCells
    .map((c) => `<span class="md-table-cell md-table-cell--sep">${escapeHtml(c)}</span>`)
    .join("");
  const parts: string[] = [
    '<div class="md-table-wrap" role="table">',
    `<div class="md-line md-table-row md-table-row--head" role="row">${headHtml}</div>`,
    `<div class="md-line md-table-row md-table-row--sep" role="row">${sepHtml}</div>`,
  ];
  for (const line of rows.slice(2)) {
    const cells = padTableCells(splitPipeCells(line) ?? [], colCount);
    const rowHtml = cells
      .map((c) => `<span class="md-table-cell" role="cell">${renderInline(c)}</span>`)
      .join("");
    parts.push(`<div class="md-line md-table-row" role="row">${rowHtml}</div>`);
  }
  parts.push("</div>");
  return parts.join("");
}

function renderPipeTableOverlay(rows: string[], editing: boolean): string {
  return editing ? renderTableSourceLines(rows) : renderTablePrettyGrid(rows);
}

export type RenderMarkdownOptions = {
  caretLine?: number | null;
  sourceMode?: boolean;
  tableSourceMode?: boolean;
};

/**
 * 逐行渲染。光标在表格内用源码行，离开后用网格预览。
 */
export function renderMarkdown(md: string, options?: RenderMarkdownOptions): string {
  const lines = md.split("\n");
  const caretLine = options?.caretLine ?? null;
  const sourceMode = options?.sourceMode ?? false;
  const tableSourceMode = options?.tableSourceMode ?? false;
  const chunks: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const block = tryParsePipeTableAt(lines, i);
    if (block) {
      const editing =
        tableSourceMode ||
        sourceMode ||
        (caretLine !== null && caretLine >= i && caretLine < block.end);
      chunks.push(renderPipeTableOverlay(block.lines, editing));
      i = block.end;
      continue;
    }
    // 编辑时全部行显示源码，与透明 contenteditable 等行高等宽，避免长文光标错位
    const lineSourceMode = sourceMode;
    chunks.push(`<div class="md-line">${renderMarkdownLineInner(lines[i], lineSourceMode)}</div>`);
    i++;
  }
  return chunks.join("");
}

export function renderInline(text: string): string {
  return text
    .split(/(<!--[\s\S]*?-->)/g)
    .map((segment) => {
      if (/^<!--[\s\S]*-->$/.test(segment)) {
        const inner = segment.replace(/^<!--\s*/, "").replace(/\s*-->$/, "");
        return `<span class="md-comment">${escapeHtml(inner)}</span>`;
      }
      return renderInlineNonComment(segment);
    })
    .join("");
}

function renderInlineNonComment(text: string): string {
  let result = escapeHtml(text);
  result = result.replace(/~~(.+?)~~/g, "<del>$1</del>");
  result = result.replace(/==(.+?)==/g, '<mark class="md-mark">$1</mark>');
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(/`(.+?)`/g, "<code>$1</code>");
  result = result.replace(/\$([^$\n]+?)\$/g, '<span class="md-math">$1</span>');
  return result;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
