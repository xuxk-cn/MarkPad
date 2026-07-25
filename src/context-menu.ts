import { t, type I18nKey } from "./i18n";
import {
  copySelection,
  cutSelection,
  hasEditorSelection,
  pasteFromClipboard,
} from "./clipboard";
import {
  wrapSelection,
  replaceSelection,
  clearMarkdownFormatting,
  getSelectedPlainText,
  insertFootnote,
  insertCallout,
  insertHr,
  insertCodeBlock,
  insertMathBlock,
} from "./markdown-edit";

type MenuItem =
  | { type: "header"; labelKey: I18nKey }
  | { type: "separator" }
  | {
      type: "action";
      labelKey: I18nKey;
      run: (source: HTMLElement) => void;
      disabled?: (source: HTMLElement) => boolean;
    };

const MENU_ITEMS: MenuItem[] = [
  {
    type: "action",
    labelKey: "ctx.cut",
    run: (s) => {
      void cutSelection(s);
    },
    disabled: (s) => !hasEditorSelection(s),
  },
  {
    type: "action",
    labelKey: "ctx.copy",
    run: (s) => {
      void copySelection(s);
    },
    disabled: (s) => !hasEditorSelection(s),
  },
  {
    type: "action",
    labelKey: "ctx.paste",
    run: (s) => {
      void pasteFromClipboard(s);
    },
  },
  { type: "separator" },
  { type: "header", labelKey: "ctx.insert" },
  { type: "action", labelKey: "ctx.footnote", run: insertFootnote },
  // 插入表格：暂缓，待表格编辑重写后恢复（见 insert-table-dialog.ts）
  { type: "action", labelKey: "ctx.callout", run: insertCallout },
  { type: "action", labelKey: "ctx.hr", run: insertHr },
  { type: "action", labelKey: "ctx.codeBlock", run: insertCodeBlock },
  { type: "action", labelKey: "ctx.mathBlock", run: insertMathBlock },
  { type: "header", labelKey: "ctx.format" },
  { type: "action", labelKey: "ctx.bold", run: (s) => wrapSelection(s, "**", "**") },
  { type: "action", labelKey: "ctx.italic", run: (s) => wrapSelection(s, "*", "*") },
  { type: "action", labelKey: "ctx.strike", run: (s) => wrapSelection(s, "~~", "~~") },
  { type: "action", labelKey: "ctx.highlight", run: (s) => wrapSelection(s, "==", "==") },
  { type: "action", labelKey: "ctx.code", run: (s) => wrapSelection(s, "`", "`") },
  { type: "action", labelKey: "ctx.math", run: (s) => wrapSelection(s, "$", "$") },
  { type: "action", labelKey: "ctx.comment", run: (s) => wrapSelection(s, "<!-- ", " -->") },
  {
    type: "action",
    labelKey: "ctx.clearFormat",
    run: (s) => {
      const raw = getSelectedPlainText(s);
      if (!raw) return;
      replaceSelection(s, clearMarkdownFormatting(raw));
    },
  },
];

let menuEl: HTMLDivElement | null = null;
let boundSource: HTMLElement | null = null;

export function setupContextMenu(sourceEl: HTMLElement): void {
  boundSource = sourceEl;
  menuEl = document.getElementById("editor-context-menu") as HTMLDivElement | null;
  if (!menuEl) return;

  rebuildMenu(menuEl);

  sourceEl.addEventListener("contextmenu", (e: MouseEvent) => {
    e.preventDefault();
    showMenu(e.clientX, e.clientY);
  });

  document.addEventListener("click", () => hideMenu());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideMenu();
  });
  window.addEventListener("fast-md:locale", () => {
    if (menuEl) rebuildMenu(menuEl);
  });

  menuEl.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-ctx-action]");
    if (!btn || btn.disabled || !boundSource) return;
    e.stopPropagation();
    const idx = Number(btn.dataset.ctxAction);
    const item = MENU_ITEMS[idx];
    if (item?.type === "action") {
      item.run(boundSource);
      hideMenu();
    }
  });
}

function rebuildMenu(menu: HTMLDivElement): void {
  menu.innerHTML = "";
  MENU_ITEMS.forEach((item, idx) => {
    if (item.type === "separator") {
      const sep = document.createElement("div");
      sep.className = "ctx-menu__sep";
      menu.appendChild(sep);
      return;
    }
    if (item.type === "header") {
      const header = document.createElement("div");
      header.className = "ctx-menu__header";
      header.dataset.i18n = item.labelKey;
      header.textContent = t(item.labelKey);
      menu.appendChild(header);
      return;
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ctx-menu__item";
    btn.dataset.ctxAction = String(idx);
    btn.dataset.i18n = item.labelKey;
    btn.textContent = t(item.labelKey);
    menu.appendChild(btn);
  });
}

function updateMenuItemStates(): void {
  if (!menuEl || !boundSource) return;
  MENU_ITEMS.forEach((item, idx) => {
    if (item.type !== "action" || !item.disabled) return;
    const btn = menuEl!.querySelector<HTMLButtonElement>(`[data-ctx-action="${idx}"]`);
    if (btn) btn.disabled = item.disabled(boundSource!);
  });
}

function showMenu(x: number, y: number): void {
  if (!menuEl) return;
  updateMenuItemStates();
  menuEl.classList.remove("hidden");
  const pad = 8;
  const rect = menuEl.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - pad;
  const maxY = window.innerHeight - rect.height - pad;
  menuEl.style.left = `${Math.max(pad, Math.min(x, maxX))}px`;
  menuEl.style.top = `${Math.max(pad, Math.min(y, maxY))}px`;
}

function hideMenu(): void {
  menuEl?.classList.add("hidden");
}
