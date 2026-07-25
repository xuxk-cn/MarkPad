import { invoke } from "@tauri-apps/api/core";
import { renderMarkdown } from "./renderer";
import { normalizeDocText } from "./viewport-overlay";
import { resolvePasteFromDataTransfer } from "./paste-resolve";
import { handleTableTab } from "./table-edit";
import { handleMarkdownAutoPairKeydown } from "./markdown-auto-pair";

function getCaretLineIndex(source: HTMLElement): number | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!source.contains(range.commonAncestorContainer)) return null;
  const pre = range.cloneRange();
  pre.selectNodeContents(source);
  pre.setEnd(range.startContainer, range.startOffset);
  return Math.max(0, pre.toString().split("\n").length - 1);
}

function getSelectionRangeInside(source: HTMLElement): Range | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!source.contains(range.commonAncestorContainer)) return null;
  return range;
}

export function insertPlainTextAtSelection(source: HTMLElement, text: string): void {
  source.focus();
  const sel = window.getSelection();
  const range = getSelectionRangeInside(source);
  if (!sel || !range) {
    const node = document.createTextNode(text);
    source.appendChild(node);
    if (sel) {
      const nextRange = document.createRange();
      nextRange.setStart(node, node.length);
      nextRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(nextRange);
    }
    return;
  }

  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStart(node, node.length);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function placeCaretAtEnd(source: HTMLElement): void {
  source.focus();
  const sel = window.getSelection();
  if (!sel) return;

  let last: Text | null = null;
  const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    last = node as Text;
  }

  if (!last) {
    last = document.createTextNode("");
    source.appendChild(last);
  }

  const range = document.createRange();
  range.setStart(last, last.length);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function isClickBelowEditableContent(source: HTMLElement, e: MouseEvent): boolean {
  const lineHeight = parseFloat(getComputedStyle(source).lineHeight) || 24;
  const range = document.createRange();
  range.selectNodeContents(source);
  const rects = Array.from(range.getClientRects());
  range.detach();
  const lastRect = rects[rects.length - 1];
  if (!lastRect) return true;
  return e.clientY >= lastRect.bottom - lineHeight * 0.35;
}

function isPointInsideOverlayTable(overlay: HTMLElement, e: MouseEvent): boolean {
  const tables = Array.from(overlay.querySelectorAll<HTMLElement>(".md-table-wrap"));
  return tables.some((table) => {
    const rect = table.getBoundingClientRect();
    return (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    );
  });
}

/** 全文已写入 Rope 并刷新叠加层后派发，供自动落盘监听 */
export const ROPE_SYNCED_EVENT = "markpad:rope-synced";

/** 连续输入时合并 Rope / 解析调用，降低 IPC 频率 */
const SYNC_DEBOUNCE_MS = 120;

let boundSource: HTMLElement | null = null;
let boundOverlay: HTMLElement | null = null;
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let sourceFocused = false;
let forceTableSourceMode = false;

export function setEditorPlainText(sourceEl: HTMLElement, text: string): void {
  sourceEl.textContent = normalizeDocText(text);
}

/**
 * 叠加层：按源码逐行渲染，保证每一行在滚动区域内都有可见的格式化内容。
 * （块级视口切片与 pulldown 块高不一致时，文末会出现「未选中看不见」的问题，故暂不使用。）
 */
function paintOverlayFromSource(): void {
  if (!boundOverlay || !boundSource) return;
  const text = normalizeDocText(boundSource.innerText ?? "");
  const caretLine = sourceFocused ? getCaretLineIndex(boundSource) : null;
  boundOverlay.innerHTML = renderMarkdown(text, {
    caretLine,
    sourceMode: sourceFocused,
    tableSourceMode: forceTableSourceMode,
  });
  syncOverlayHeightToSource();
}

/** 叠加层与源码层同高；用 minHeight 对齐，避免裁剪导致行间错位 */
function syncOverlayHeightToSource(): void {
  if (!boundOverlay || !boundSource) return;
  const h = boundSource.offsetHeight;
  boundOverlay.style.minHeight = `${h}px`;
  boundOverlay.style.height = "auto";
  boundOverlay.style.overflow = "visible";
  requestAnimationFrame(() => {
    if (!boundOverlay || !boundSource) return;
    const next = boundSource.offsetHeight;
    boundOverlay.style.minHeight = `${next}px`;
  });
}

/** 仅根据当前编辑区重绘叠加层（不碰 Rope）。输入时应立即调用，避免透明源码与预览错位。 */
export function refreshOverlayOnly(): void {
  paintOverlayFromSource();
}

/** 在光标/选区处插入纯文本并刷新预览与 Rope 同步 */
export function pastePlainText(source: HTMLElement, raw: string): void {
  insertPlainTextAtSelection(source, normalizeDocText(raw));
  refreshOverlayOnly();
  scheduleDebouncedRopeSync();
}

/**
 * 仅清除待执行的防抖定时器（不写入 Rope）。
 */
export function cancelDebouncedRopeSync(): void {
  if (syncDebounceTimer !== null) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }
}

/**
 * 立即将当前编辑区同步到 Rope 并刷新叠加层（取消待防抖任务）。
 */
export async function flushPendingRopeSync(): Promise<void> {
  cancelDebouncedRopeSync();
  if (boundSource && boundOverlay) {
    await syncRopeAndOverlay(boundSource, boundOverlay);
  }
}

function scheduleDebouncedRopeSync(): void {
  if (!boundSource || !boundOverlay) return;
  cancelDebouncedRopeSync();
  syncDebounceTimer = setTimeout(() => {
    syncDebounceTimer = null;
    void syncRopeAndOverlay(boundSource!, boundOverlay!);
  }, SYNC_DEBOUNCE_MS);
}

/** 刷新叠加层（正文以编辑区为准，逐行 Markdown 渲染） */
export async function applyOverlayFromRope(overlayEl: HTMLElement): Promise<void> {
  boundOverlay = overlayEl;
  paintOverlayFromSource();
  requestAnimationFrame(() => paintOverlayFromSource());
}

/**
 * 将编辑区全文写入 Rope，再刷新叠加层
 */
export async function syncRopeAndOverlay(sourceEl: HTMLElement, overlayEl: HTMLElement): Promise<void> {
  const text = sourceEl.innerText ?? "";
  await invoke("text_set_all", { text });
  await applyOverlayFromRope(overlayEl);
  window.dispatchEvent(new CustomEvent(ROPE_SYNCED_EVENT));
}

/**
 * 设置 edit 事件监听
 */
function syncSelectionOverlayMode(): void {
  const wrap = document.getElementById("editor-wrapper");
  if (!wrap || !boundSource) return;
  const sel = window.getSelection();
  let hasRange = false;
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    if (!range.collapsed && boundSource.contains(range.commonAncestorContainer)) {
      hasRange = true;
    }
  }
  wrap.classList.toggle("editor-has-selection", hasRange);
  refreshOverlayOnly();
}

export function setupEditor(sourceEl: HTMLElement, overlayEl: HTMLElement): void {
  boundSource = sourceEl;
  boundOverlay = overlayEl;

  let composing = false;

  document.addEventListener("selectionchange", syncSelectionOverlayMode);
  document.addEventListener(
    "pointerdown",
    (e) => {
      sourceFocused = e.target instanceof Node && sourceEl.contains(e.target);
      forceTableSourceMode = sourceFocused && isPointInsideOverlayTable(overlayEl, e);
      if (forceTableSourceMode) {
        refreshOverlayOnly();
      }
      requestAnimationFrame(() => {
        forceTableSourceMode = false;
        syncSelectionOverlayMode();
        refreshOverlayOnly();
      });
    },
    true,
  );

  sourceEl.addEventListener("compositionstart", () => {
    composing = true;
  });

  /** 中文等 IME 组字过程中仍需刷新叠加层，否则整段预览滞后 */
  sourceEl.addEventListener("compositionupdate", () => {
    refreshOverlayOnly();
  });

  sourceEl.addEventListener("compositionend", async () => {
    composing = false;
    cancelDebouncedRopeSync();
    await syncRopeAndOverlay(sourceEl, overlayEl);
  });

  sourceEl.addEventListener("input", () => {
    if (composing) return;
    refreshOverlayOnly();
    scheduleDebouncedRopeSync();
  });

  sourceEl.addEventListener("beforeinput", (e: InputEvent) => {
    if (composing) return;
    if (e.inputType !== "insertParagraph" && e.inputType !== "insertLineBreak") return;
    e.preventDefault();
    insertPlainTextAtSelection(sourceEl, "\n");
    refreshOverlayOnly();
    scheduleDebouncedRopeSync();
  });

  sourceEl.addEventListener("paste", (e: ClipboardEvent) => {
    e.preventDefault();
    if (!e.clipboardData) return;
    const text = resolvePasteFromDataTransfer(e.clipboardData);
    if (!text) return;
    pastePlainText(sourceEl, text);
  });

  // NOTE: 仿 Obsidian Advanced Tables：只在 Tab/Shift+Tab 时格式化表格并导航单元格
  sourceEl.addEventListener("keydown", (e: KeyboardEvent) => {
    if (handleMarkdownAutoPairKeydown(sourceEl, e)) {
      refreshOverlayOnly();
      scheduleDebouncedRopeSync();
      return;
    }
    if (e.key === "Tab") {
      const handled = handleTableTab(sourceEl, e.shiftKey);
      if (handled) {
        e.preventDefault();
        refreshOverlayOnly();
        scheduleDebouncedRopeSync();
      }
    }
  });

  sourceEl.addEventListener("click", () => {
    syncSelectionOverlayMode();
    refreshOverlayOnly();
    requestAnimationFrame(() => {
      syncSelectionOverlayMode();
      refreshOverlayOnly();
    });
  });
  sourceEl.addEventListener("mousedown", (e: MouseEvent) => {
    if (e.button !== 0) return;
    if (!isClickBelowEditableContent(sourceEl, e)) return;
    e.preventDefault();
    sourceFocused = true;
    placeCaretAtEnd(sourceEl);
    refreshOverlayOnly();
  });
  sourceEl.addEventListener("focus", () => {
    sourceFocused = true;
    refreshOverlayOnly();
  });
  sourceEl.addEventListener("blur", () => {
    sourceFocused = false;
    forceTableSourceMode = false;
    syncSelectionOverlayMode();
    refreshOverlayOnly();
  });
  sourceEl.addEventListener("keyup", () => {
    syncSelectionOverlayMode();
    refreshOverlayOnly();
  });
  sourceEl.addEventListener("mouseup", syncSelectionOverlayMode);
}



/**
 * 从 Rust Rope 加载源码并刷新叠加层
 */
export async function loadFromRope(sourceEl: HTMLElement, overlayEl: HTMLElement): Promise<void> {
  cancelDebouncedRopeSync();
  const text: string = await invoke("text_get_all");
  setEditorPlainText(sourceEl, text);
  await applyOverlayFromRope(overlayEl);
}
