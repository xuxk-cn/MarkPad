import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  setupEditor,
  loadFromRope,
  applyOverlayFromRope,
  flushPendingRopeSync,
  cancelDebouncedRopeSync,
  ROPE_SYNCED_EVENT,
  setEditorPlainText,
} from "./editor";
import { rememberRecentPath, refreshRecentSelect } from "./recent-files";
import { t } from "./i18n";
import { loadSettings, setupSettingsModal, setupFontZoom } from "./settings";
import { setupContextMenu } from "./context-menu";
import {
  byteOffsetToCharIndex,
  selectFlatRange,
  scrollSelectionIntoView,
} from "./search-nav";

type SearchHit = { line: number; byte_offset: number };

let sourceEl: HTMLElement;
let overlayEl: HTMLElement;
let titleEl: HTMLElement;
let findBar: HTMLElement;
let findInput: HTMLInputElement;
let findMeta: HTMLElement;
let autoSaveTimer: ReturnType<typeof setInterval> | null = null;
/** 已关联磁盘路径时，Rope 同步后延迟写入磁盘（毫秒） */
const DISK_AUTOSAVE_DEBOUNCE_MS = 1200;
let diskAutoSaveTimer: ReturnType<typeof setTimeout> | null = null;

let searchHits: SearchHit[] = [];
let searchIndex = -1;
let lastSearchQuery = "";

document.addEventListener("DOMContentLoaded", async () => {
  loadSettings();

  sourceEl = document.getElementById("editor-source")!;
  overlayEl = document.getElementById("editor-overlay")!;
  titleEl = document.getElementById("titlebar-filename")!;
  findBar = document.getElementById("find-bar")!;
  findInput = document.getElementById("find-input") as HTMLInputElement;
  findMeta = document.getElementById("find-meta")!;

  setupEditor(sourceEl, overlayEl);
  setupContextMenu(sourceEl);
  setupSettingsModal();
  setupFontZoom(document.getElementById("editor-wrapper")!);

  await loadFromRope(sourceEl, overlayEl);
  const startupPath = await invoke<string | null>("take_startup_open_path");
  if (startupPath) {
    await openFileByPath(startupPath);
  }
  void listen<string>("open-file", (e) => {
    void openFileByPath(e.payload);
  });
  bindToolbar();
  bindFindBar();
  bindShortcuts();
  bindLocaleRefresh();
  setupObsidianStyleAutoSave();
  startPeriodicDiskSafetySave();
  await updateTitle();
});

function recentSelectEl(): HTMLSelectElement | null {
  return document.getElementById("recent-select") as HTMLSelectElement | null;
}

function bindLocaleRefresh(): void {
  window.addEventListener("fast-md:locale", () => {
    const sel = recentSelectEl();
    if (sel) refreshRecentSelect(sel);
    void updateTitle();
  });
}

function bindToolbar(): void {
  const btnNew = document.getElementById("btn-new");
  const btnOpen = document.getElementById("btn-open");
  const btnSave = document.getElementById("btn-save");
  const btnCopy = document.getElementById("btn-copy-md");
  const recentSelect = recentSelectEl();

  if (btnNew) btnNew.onclick = () => void handleNew();
  if (btnOpen) btnOpen.onclick = handleOpen;
  if (btnSave) btnSave.onclick = handleSave;
  if (btnCopy) btnCopy.onclick = () => void handleCopyMarkdown();
  if (recentSelect) {
    refreshRecentSelect(recentSelect);
    recentSelect.addEventListener("change", () => void handleRecentPick(recentSelect));
  }
}

async function openFileByPath(path: string): Promise<void> {
  await flushPendingRopeSync();
  const content = await invoke<string>("file_open_path", { path });
  setEditorPlainText(sourceEl, content);
  await applyOverlayFromRope(overlayEl);
  rememberRecentPath(path);
  const rs = recentSelectEl();
  if (rs) refreshRecentSelect(rs);
  await updateTitle();
}

async function handleRecentPick(select: HTMLSelectElement): Promise<void> {
  const path = select.value;
  if (!path) return;
  try {
    await openFileByPath(path);
  } catch (e) {
    console.error("[markpad] open recent failed:", e);
    alert(String(e));
  } finally {
    select.selectedIndex = 0;
  }
}

async function handleCopyMarkdown(): Promise<void> {
  try {
    await flushPendingRopeSync();
    const text = sourceEl.innerText ?? "";
    await navigator.clipboard.writeText(text);
  } catch (e) {
    console.error("[markpad] copy failed:", e);
  }
}

async function handleNew(): Promise<void> {
  try {
    const currentPath: string | null = await invoke("file_current_path");
    const hasContent = (sourceEl.innerText ?? "").trim().length > 0;
    if (currentPath || hasContent) {
      if (!confirm(t("new.confirm"))) return;
    }
    cancelDebouncedRopeSync();
    if (diskAutoSaveTimer !== null) {
      clearTimeout(diskAutoSaveTimer);
      diskAutoSaveTimer = null;
    }
    await invoke("file_new");
    setEditorPlainText(sourceEl, "");
    await applyOverlayFromRope(overlayEl);
    hideFindBar();
    sourceEl.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(sourceEl);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    await updateTitle();
  } catch (e) {
    console.error("[markpad] new failed:", e);
  }
}

async function handleOpen(): Promise<void> {
  try {
    const result: string | null = await invoke("file_open_dialog");
    if (!result) return;
    const [path] = JSON.parse(result) as [string, string];
    await openFileByPath(path);
  } catch (e) {
    console.error("[markpad] open failed:", e);
  }
}

async function handleSave(): Promise<void> {
  try {
    const currentPath: string | null = await invoke("file_current_path");
    let savePath = currentPath;

    if (!savePath) {
      savePath = await invoke("file_save_dialog");
      if (!savePath) return;
    }

    await flushPendingRopeSync();
    await invoke("file_save", { path: savePath });
    rememberRecentPath(savePath);
    const rs = recentSelectEl();
    if (rs) refreshRecentSelect(rs);
    await updateTitle();
  } catch (e) {
    console.error("[markpad] save failed:", e);
  }
}

function bindFindBar(): void {
  document.getElementById("find-next")?.addEventListener("click", () => findNext());
  document.getElementById("find-close")?.addEventListener("click", () => hideFindBar());
  findInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) findPrevious();
      else if (searchHits.length) findNext();
      else void runSearch();
    }
  });
}

function showFindBar(): void {
  findBar.classList.remove("hidden");
  findInput.focus();
  findInput.select();
}

function hideFindBar(): void {
  findBar.classList.add("hidden");
  findMeta.textContent = "";
  searchHits = [];
  searchIndex = -1;
  lastSearchQuery = "";
}

async function runSearch(): Promise<void> {
  const q = findInput.value.trim();
  if (!q) {
    findMeta.textContent = "";
    searchHits = [];
    searchIndex = -1;
    lastSearchQuery = "";
    return;
  }
  try {
    await flushPendingRopeSync();
    const hits = await invoke<SearchHit[]>("doc_search", { query: q, max_results: 400 });
    searchHits = hits;
    lastSearchQuery = q;
    searchIndex = hits.length ? 0 : -1;
    if (!hits.length) {
      findMeta.textContent = t("find.noResults");
      return;
    }
    goToSearchHit(0, q);
  } catch (e) {
    console.error("[markpad] search failed:", e);
    findMeta.textContent = t("find.error");
  }
}

function updateFindMeta(): void {
  if (searchHits.length === 0 || searchIndex < 0) {
    findMeta.textContent = t("find.noResults");
    return;
  }
  findMeta.textContent = t("find.index", {
    i: searchIndex + 1,
    n: searchHits.length,
  });
}

function goToSearchHit(index: number, query: string): void {
  const hit = searchHits[index];
  if (!hit || !query) return;
  const text = sourceEl.innerText ?? "";
  const start = byteOffsetToCharIndex(text, hit.byte_offset);
  const end = start + query.length;
  selectFlatRange(sourceEl, start, end);
  const wrap = document.getElementById("editor-wrapper");
  if (wrap) scrollSelectionIntoView(sourceEl, wrap);
  updateFindMeta();
}

function findNext(): void {
  if (searchHits.length === 0 || !lastSearchQuery) return;
  searchIndex = (searchIndex + 1) % searchHits.length;
  goToSearchHit(searchIndex, lastSearchQuery);
}

function findPrevious(): void {
  if (searchHits.length === 0 || !lastSearchQuery) return;
  searchIndex = searchIndex <= 0 ? searchHits.length - 1 : searchIndex - 1;
  goToSearchHit(searchIndex, lastSearchQuery);
}

function bindShortcuts(): void {
  document.addEventListener(
    "keydown",
    async (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!findBar.classList.contains("hidden")) {
          e.preventDefault();
          hideFindBar();
        }
        return;
      }
      if (e.key === "F3" && !findBar.classList.contains("hidden")) {
        e.preventDefault();
        if (e.shiftKey) findPrevious();
        else if (searchHits.length) findNext();
        else void runSearch();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        showFindBar();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        await handleSave();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        await handleOpen();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        await handleNew();
        return;
      }
    },
    true,
  );
}

function setupObsidianStyleAutoSave(): void {
  window.addEventListener(ROPE_SYNCED_EVENT, () => {
    if (diskAutoSaveTimer !== null) {
      clearTimeout(diskAutoSaveTimer);
    }
    diskAutoSaveTimer = setTimeout(() => {
      diskAutoSaveTimer = null;
      void flushAndAutoSaveToDisk();
    }, DISK_AUTOSAVE_DEBOUNCE_MS);
  });
}

/** 确保 Rope 与编辑区一致后，若有已打开路径则写回磁盘 */
async function flushAndAutoSaveToDisk(): Promise<void> {
  try {
    await flushPendingRopeSync();
    const path: string | null = await invoke("file_current_path");
    if (!path) return;
    await invoke<boolean>("file_auto_save");
  } catch (e) {
    console.error("[markpad] auto-save to disk failed:", e);
  }
}

/** 长时间无编辑时的兜底落盘（秒） */
const PERIODIC_DISK_SAVE_SEC = 30;

function startPeriodicDiskSafetySave(): void {
  autoSaveTimer = setInterval(() => {
    void flushAndAutoSaveToDisk();
  }, PERIODIC_DISK_SAVE_SEC * 1000);
}

async function updateTitle(): Promise<void> {
  const path: string | null = await invoke("file_current_path");
  if (path) {
    titleEl.textContent = path.replace(/^.*[\\/]/, "") + t("app.titleSuffix");
  } else {
    titleEl.textContent = t("title.unnamed") + t("app.titleSuffix");
  }
  document.title = titleEl.textContent;
  try {
    await getCurrentWindow().setTitle(titleEl.textContent);
  } catch {
    /* 非 Tauri 环境（如纯 Vite）忽略 */
  }
}
