import { t } from "./i18n";
import { buildObsidianStyleTableMarkdown, insertBlockWithCaretInSnippet } from "./markdown-edit";

const MAX_DIM = 10;

let modal: HTMLDivElement | null = null;
let gridEl: HTMLDivElement | null = null;
let dimsEl: HTMLElement | null = null;
let titleEl: HTMLElement | null = null;
let hintEl: HTMLElement | null = null;
let pendingSource: HTMLElement | null = null;
let selCols = 2;
let selRows = 2;
let escapeBound = false;

/** Obsidian-like table picker: hover grid to choose size, click to insert. */
export function openInsertTableDialog(source: HTMLElement): void {
  pendingSource = source;
  ensureModal();
  if (!modal) return;
  selCols = 2;
  selRows = 2;
  syncI18n();
  paintGridHighlight();
  modal.classList.remove("hidden");
}

function ensureModal(): void {
  if (modal) return;

  const root = document.createElement("div");
  root.id = "insert-table-modal";
  root.className = "table-insert-modal hidden";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "table-insert-title");

  const backdrop = document.createElement("div");
  backdrop.className = "table-insert-modal__backdrop";

  const panel = document.createElement("div");
  panel.className = "table-insert-modal__panel";

  titleEl = document.createElement("h2");
  titleEl.id = "table-insert-title";
  titleEl.className = "table-insert-modal__title";

  hintEl = document.createElement("p");
  hintEl.className = "table-insert-modal__hint";

  gridEl = document.createElement("div");
  gridEl.className = "table-insert-grid";

  for (let r = 1; r <= MAX_DIM; r++) {
    for (let c = 1; c <= MAX_DIM; c++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "table-insert-grid__cell";
      cell.dataset.col = String(c);
      cell.dataset.row = String(r);
      cell.dataset.i18nIgnore = "true";
      cell.setAttribute("aria-label", `${c}×${r}`);
      cell.addEventListener("mouseenter", () => {
        if (Number(cell.dataset.col) === selCols && Number(cell.dataset.row) === selRows) return;
        selCols = Number(cell.dataset.col);
        selRows = Number(cell.dataset.row);
        paintGridHighlight();
      });
      gridEl.appendChild(cell);
    }
  }

  dimsEl = document.createElement("p");
  dimsEl.className = "table-insert-modal__dims";

  panel.appendChild(titleEl);
  panel.appendChild(hintEl);
  panel.appendChild(gridEl);
  panel.appendChild(dimsEl);
  root.appendChild(backdrop);
  root.appendChild(panel);
  document.body.appendChild(root);
  modal = root;

  gridEl.addEventListener("click", (e) => {
    e.preventDefault();
    const el = (e.target as HTMLElement).closest("[data-col]");
    if (!el || !(el instanceof HTMLElement) || !pendingSource) return;
    const c = Number(el.dataset.col);
    const r = Number(el.dataset.row);
    selCols = c;
    selRows = r;
    // NOTE: totalRows 直接传入，函数内部会将第一行视为表头
    const md = buildObsidianStyleTableMarkdown(selCols, selRows);
    insertBlockWithCaretInSnippet(pendingSource, md, 1);
    closeModal();
  });

  backdrop.addEventListener("click", () => closeModal());

  window.addEventListener("fast-md:locale", () => {
    if (modal && !modal.classList.contains("hidden")) syncI18n();
  });

  if (!escapeBound) {
    escapeBound = true;
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !modal || modal.classList.contains("hidden")) return;
      closeModal();
    });
  }
}

function syncI18n(): void {
  if (titleEl) titleEl.textContent = t("tableInsert.title");
  if (hintEl) hintEl.textContent = t("tableInsert.hint");
  paintDimsLabel();
}

function paintDimsLabel(): void {
  if (!dimsEl) return;
  dimsEl.textContent = t("tableInsert.dimensions", {
    cols: String(selCols),
    rows: String(selRows),
  });
}

function paintGridHighlight(): void {
  if (!gridEl) return;
  const cells = gridEl.querySelectorAll<HTMLButtonElement>(".table-insert-grid__cell");
  cells.forEach((cell) => {
    const c = Number(cell.dataset.col);
    const r = Number(cell.dataset.row);
    cell.classList.toggle("is-active", c <= selCols && r <= selRows);
  });
  paintDimsLabel();
}

function closeModal(): void {
  modal?.classList.add("hidden");
  pendingSource?.focus();
  pendingSource = null;
}
