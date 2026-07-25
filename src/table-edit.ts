/**
 * 表格感知编辑模块
 *
 * 提供 Obsidian 风格的表格编辑体验：
 * - Tab / Shift+Tab 在单元格间导航
 * - 输入后自动对齐管道符
 * - Enter 在表格末尾追加新行
 */

// NOTE: 与 renderer.ts 的表格检测逻辑独立，避免循环依赖

/* ------------------------------------------------------------------ */
/*  扁平偏移工具                                                       */
/* ------------------------------------------------------------------ */

/** 获取光标在 contenteditable 中的扁平字符偏移 */
function getFlatOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return -1;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer)) return -1;
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);
  return pre.toString().length;
}

/** 设置光标到扁平偏移位置 */
function setFlatOffset(el: HTMLElement, offset: number): void {
  el.focus();
  const sel = window.getSelection();
  if (!sel) return;
  let rem = Math.max(0, offset);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  let last: Text | null = null;
  while ((node = walker.nextNode())) {
    const t = node as Text;
    last = t;
    if (rem <= t.length) {
      const r = document.createRange();
      r.setStart(t, rem);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      return;
    }
    rem -= t.length;
  }
  if (last) {
    const r = document.createRange();
    r.setStart(last, last.length);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  }
}

/* ------------------------------------------------------------------ */
/*  管道表检测                                                         */
/* ------------------------------------------------------------------ */

function isPipeRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.includes("|", 1);
}

function isSepRow(line: string): boolean {
  const t = line.trim();
  if (!t.startsWith("|")) return false;
  const inner = t.endsWith("|") ? t.slice(1, -1) : t.slice(1);
  return inner.split("|").every((c) => /^\s*:?-{2,}:?\s*$/.test(c));
}

/** 解析行为原始单元格（保留内部空格） */
function rawCells(line: string): string[] {
  const t = line.trim();
  if (!t.startsWith("|")) return [];
  const inner = t.endsWith("|") ? t.slice(1, -1) : t.slice(1);
  return inner.split("|");
}

interface TableInfo {
  startLine: number;
  endLine: number;
  charStart: number;
  lines: string[];
}

function lineOfOffset(text: string, offset: number): number {
  let count = 0;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    count += lines[i].length;
    if (offset <= count) return i;
    count += 1;
  }
  return lines.length - 1;
}

/** 找到包含 targetLine 的表格块 */
function findTable(allLines: string[], targetLine: number): TableInfo | null {
  if (targetLine >= allLines.length || !isPipeRow(allLines[targetLine])) return null;

  let start = targetLine;
  while (start > 0 && isPipeRow(allLines[start - 1])) start--;

  if (start + 1 >= allLines.length || !isSepRow(allLines[start + 1])) return null;

  let end = start + 2;
  while (end < allLines.length && isPipeRow(allLines[end]) && !isSepRow(allLines[end])) {
    end++;
  }

  let charStart = 0;
  for (let i = 0; i < start; i++) charStart += allLines[i].length + 1;

  return { startLine: start, endLine: end, charStart, lines: allLines.slice(start, end) };
}

/* ------------------------------------------------------------------ */
/*  表格格式化                                                         */
/* ------------------------------------------------------------------ */

/** 重新格式化表格：统一列宽、对齐管道符 */
function reformatLines(tbl: string[]): string[] {
  if (tbl.length < 2) return tbl;

  const colCount = Math.max(1, rawCells(tbl[0]).length);

  const parsed = tbl.map((line) => {
    const cells = rawCells(line).map((c) => c.trim());
    while (cells.length < colCount) cells.push("");
    return cells.slice(0, colCount);
  });

  // 最小列宽 3（容纳 ---）
  const widths = Array.from({ length: colCount }, (_, c) => {
    let max = 3;
    for (let r = 0; r < parsed.length; r++) {
      if (r === 1) continue;
      max = Math.max(max, parsed[r][c].length || 1);
    }
    return max;
  });

  return tbl.map((_, r) => {
    if (r === 1) {
      return "|" + widths.map((w) => " " + "-".repeat(w) + " ").join("|") + "|";
    }
    const cells = parsed[r].map((content, c) => {
      return " " + content + " ".repeat(widths[c] - content.length) + " ";
    });
    return "|" + cells.join("|") + "|";
  });
}

/* ------------------------------------------------------------------ */
/*  光标 ↔ 单元格映射                                                  */
/* ------------------------------------------------------------------ */

interface CellPos {
  row: number;
  col: number;
  inCell: number;
}

function offsetToCellPos(tbl: string[], offsetInTable: number): CellPos {
  let rem = offsetInTable;
  for (let r = 0; r < tbl.length; r++) {
    if (rem <= tbl[r].length || r === tbl.length - 1) {
      const pos = Math.min(rem, tbl[r].length);
      const cells = rawCells(tbl[r]);
      let cursor = 1;
      for (let c = 0; c < cells.length; c++) {
        const cellEnd = cursor + cells[c].length;
        if (pos <= cellEnd || c === cells.length - 1) {
          const trimStart = cells[c].length - cells[c].trimStart().length;
          const contentLen = cells[c].trim().length;
          return { row: r, col: c, inCell: Math.max(0, Math.min(pos - cursor - trimStart, contentLen)) };
        }
        cursor = cellEnd + 1;
      }
      return { row: r, col: 0, inCell: 0 };
    }
    rem -= tbl[r].length + 1;
  }
  return { row: 0, col: 0, inCell: 0 };
}

/** 从单元格位置 → 已格式化表格中的字符偏移 */
function cellPosToOffset(fmtLines: string[], pos: CellPos): number {
  let off = 0;
  const r = Math.min(pos.row, fmtLines.length - 1);
  for (let i = 0; i < r; i++) off += fmtLines[i].length + 1;

  const cells = rawCells(fmtLines[r]);
  let cursor = 1;
  const c = Math.min(pos.col, cells.length - 1);
  for (let i = 0; i < c; i++) cursor += cells[i].length + 1;

  const trimStart = cells[c].length - cells[c].trimStart().length;
  const contentLen = cells[c].trim().length;
  off += cursor + trimStart + Math.min(pos.inCell, contentLen);
  return off;
}

/* ------------------------------------------------------------------ */
/*  公开 API                                                           */
/* ------------------------------------------------------------------ */

/**
 * 自动格式化光标所在表格，保持管道符对齐。
 * 用 execCommand("insertText") 替换以保留浏览器撤销栈。
 * @returns 是否实际执行了格式化
 */
export function autoFormatTableAtCaret(source: HTMLElement): boolean {
  const text = source.innerText ?? "";
  const caret = getFlatOffset(source);
  if (caret < 0) return false;

  const allLines = text.split("\n");
  const caretLine = lineOfOffset(text, caret);
  const info = findTable(allLines, caretLine);
  if (!info) return false;

  const formatted = reformatLines(info.lines);
  const oldBlock = info.lines.join("\n");
  const newBlock = formatted.join("\n");
  if (oldBlock === newBlock) return false;

  // 计算新光标位置
  const cellPos = offsetToCellPos(info.lines, caret - info.charStart);
  const newLocalOffset = cellPosToOffset(formatted, cellPos);
  const newCaret = info.charStart + newLocalOffset;

  // 选中旧表格文本并替换（保留 undo）
  selectFlatRange(source, info.charStart, info.charStart + oldBlock.length);
  document.execCommand("insertText", false, newBlock);

  // 恢复光标
  setFlatOffset(source, newCaret);
  return true;
}

/** 选中从 start 到 end 的扁平文本范围 */
function selectFlatRange(el: HTMLElement, start: number, end: number): void {
  el.focus();
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();

  let rem = start;
  const walker1 = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  let startNode: Text | null = null;
  let startOff = 0;
  while ((node = walker1.nextNode())) {
    const t = node as Text;
    if (rem <= t.length) {
      startNode = t;
      startOff = rem;
      break;
    }
    rem -= t.length;
  }
  if (!startNode) return;

  rem = end;
  const walker2 = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let endNode: Text | null = null;
  let endOff = 0;
  while ((node = walker2.nextNode())) {
    const t = node as Text;
    if (rem <= t.length) {
      endNode = t;
      endOff = rem;
      break;
    }
    rem -= t.length;
  }
  if (!endNode) return;

  range.setStart(startNode, startOff);
  range.setEnd(endNode, endOff);
  sel.removeAllRanges();
  sel.addRange(range);
}

/**
 * Tab / Shift+Tab 在表格单元格间导航。
 * @returns 是否在表格中处理了 Tab
 */
export function handleTableTab(source: HTMLElement, shiftKey: boolean): boolean {
  const text = source.innerText ?? "";
  const caret = getFlatOffset(source);
  if (caret < 0) return false;

  const allLines = text.split("\n");
  const caretLine = lineOfOffset(text, caret);
  const info = findTable(allLines, caretLine);
  if (!info) return false;

  // 先格式化
  const formatted = reformatLines(info.lines);
  const oldBlock = info.lines.join("\n");
  const newBlock = formatted.join("\n");

  const cellPos = offsetToCellPos(info.lines, caret - info.charStart);
  const colCount = Math.max(1, rawCells(formatted[0]).length);

  // 计算下一个/上一个单元格（跳过分隔行 row=1）
  let { row, col } = cellPos;
  if (shiftKey) {
    col--;
    if (col < 0) {
      row--;
      if (row === 1) row--; // 跳过分隔行
      col = colCount - 1;
    }
    if (row < 0) { row = 0; col = 0; }
  } else {
    col++;
    if (col >= colCount) {
      row++;
      if (row === 1) row++; // 跳过分隔行
      col = 0;
    }
    // 如果越过表格最后一行，追加新行
    if (row >= formatted.length) {
      const emptyRow = "|" + formatted[0]
        .slice(1)
        .split("|")
        .map((c) => " ".repeat(c.length))
        .join("|");
      formatted.push(emptyRow.endsWith("|") ? emptyRow : emptyRow + "|");
      row = formatted.length - 1;
      col = 0;
    }
  }

  const finalBlock = formatted.join("\n");

  // 替换文本
  if (finalBlock !== oldBlock) {
    selectFlatRange(source, info.charStart, info.charStart + oldBlock.length);
    document.execCommand("insertText", false, finalBlock);
  }

  // 将光标定位到目标单元格内容开头
  const targetPos: CellPos = { row, col, inCell: 0 };
  const newCaret = info.charStart + cellPosToOffset(formatted, targetPos);
  setFlatOffset(source, newCaret);

  // 选中目标单元格内容，方便直接覆盖输入
  const cells = rawCells(formatted[row]);
  if (col < cells.length) {
    const content = cells[col].trim();
    if (content.length > 0) {
      const endPos: CellPos = { row, col, inCell: content.length };
      const endCaret = info.charStart + cellPosToOffset(formatted, endPos);
      selectFlatRange(source, newCaret, endCaret);
    }
  }

  return true;
}

/**
 * 判断光标是否在管道表内
 */
export function isCaretInTable(source: HTMLElement): boolean {
  const text = source.innerText ?? "";
  const caret = getFlatOffset(source);
  if (caret < 0) return false;
  const allLines = text.split("\n");
  const caretLine = lineOfOffset(text, caret);
  return findTable(allLines, caretLine) !== null;
}
