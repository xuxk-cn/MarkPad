import { t } from "./i18n";

const STORAGE_KEY = "fast-md.recent-paths";
const MAX_ENTRIES = 10;
export function loadRecentPaths(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is string => typeof p === "string" && p.length > 0);
  } catch {
    return [];
  }
}

function saveRecentPaths(paths: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(paths.slice(0, MAX_ENTRIES)));
}

/** 将路径插到列表前并去重（开发方案 §6 最近文件） */
export function rememberRecentPath(path: string): void {
  const p = path.trim();
  if (!p) return;
  const next = [p, ...loadRecentPaths().filter((x) => x !== p)];
  saveRecentPaths(next);
}

export function refreshRecentSelect(select: HTMLSelectElement): void {
  const paths = loadRecentPaths();
  select.innerHTML = "";
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = t("recent.placeholder");  select.appendChild(ph);
  for (const p of paths) {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p.replace(/^.*[\\/]/, "") || p;
    opt.title = p;
    select.appendChild(opt);
  }
  select.selectedIndex = 0;
}
