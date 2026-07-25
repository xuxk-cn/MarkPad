export type Locale = "zh" | "en";

export type I18nKey =
  | "app.titleSuffix"
  | "title.unnamed"
  | "btn.new"
  | "btn.open"
  | "btn.save"
  | "new.confirm"
  | "btn.copy"
  | "btn.settings"
  | "recent.placeholder"
  | "find.label"
  | "find.placeholder"
  | "find.next"
  | "find.close"
  | "find.noResults"
  | "find.count"
  | "find.index"
  | "find.error"
  | "settings.title"
  | "settings.theme"
  | "settings.themeLight"
  | "settings.themeDark"
  | "settings.language"
  | "settings.langZh"
  | "settings.langEn"
  | "settings.fontSize"
  | "settings.close"
  | "ctx.cut"
  | "ctx.copy"
  | "ctx.paste"
  | "ctx.insert"
  | "ctx.format"
  | "ctx.footnote"
  | "ctx.table"
  | "ctx.callout"
  | "ctx.hr"
  | "ctx.codeBlock"
  | "ctx.mathBlock"
  | "ctx.bold"
  | "ctx.italic"
  | "ctx.strike"
  | "ctx.highlight"
  | "ctx.code"
  | "ctx.math"
  | "ctx.comment"
  | "ctx.clearFormat"
  | "placeholder.text"
  | "tableInsert.title"
  | "tableInsert.hint"
  | "tableInsert.dimensions";

const zh: Record<I18nKey, string> = {
  "app.titleSuffix": " — MarkPad",
  "title.unnamed": "未命名",
  "btn.new": "新建",
  "btn.open": "打开",
  "btn.save": "保存",
  "new.confirm": "当前文档尚未保存，确定要新建并丢弃未保存的内容吗？",
  "btn.copy": "复制",
  "btn.settings": "设置",
  "recent.placeholder": "最近文件…",
  "find.label": "查找",
  "find.placeholder": "在文档中搜索…",
  "find.next": "下一个",
  "find.close": "关闭",
  "find.noResults": "无结果",
  "find.count": "共 {n} 处",
  "find.index": "第 {i} / {n} 处",
  "find.error": "搜索出错",
  "settings.title": "设置",
  "settings.theme": "外观",
  "settings.themeLight": "浅色",
  "settings.themeDark": "深色",
  "settings.language": "语言",
  "settings.langZh": "中文",
  "settings.langEn": "English",
  "settings.fontSize": "字号：{n}px（Ctrl + 滚轮）",
  "settings.close": "关闭",
  "ctx.cut": "剪切",
  "ctx.copy": "复制",
  "ctx.paste": "粘贴",
  "ctx.insert": "插入",
  "ctx.format": "文本格式",
  "ctx.footnote": "脚注",
  "ctx.table": "表格",
  "ctx.callout": "标注",
  "ctx.hr": "分隔线",
  "ctx.codeBlock": "代码块",
  "ctx.mathBlock": "数学块",
  "ctx.bold": "加粗",
  "ctx.italic": "倾斜",
  "ctx.strike": "删除线",
  "ctx.highlight": "高亮",
  "ctx.code": "代码",
  "ctx.math": "数学",
  "ctx.comment": "注释",
  "ctx.clearFormat": "清除格式",
  "placeholder.text": "文本",
  "tableInsert.title": "插入表格",
  "tableInsert.hint": "在上方网格中移动选择列数与行数（含表头行），点击格子插入。",
  "tableInsert.dimensions": "{cols} 列 × {rows} 行",
};

const en: Record<I18nKey, string> = {
  "app.titleSuffix": " — MarkPad",
  "title.unnamed": "Untitled",
  "btn.new": "New",
  "btn.open": "Open",
  "btn.save": "Save",
  "new.confirm": "Discard unsaved changes and create a new document?",
  "btn.copy": "Copy",
  "btn.settings": "Settings",
  "recent.placeholder": "Recent files…",
  "find.label": "Find",
  "find.placeholder": "Search in document…",
  "find.next": "Next",
  "find.close": "Close",
  "find.noResults": "No results",
  "find.count": "{n} matches",
  "find.index": "{i} of {n}",
  "find.error": "Search failed",
  "settings.title": "Settings",
  "settings.theme": "Appearance",
  "settings.themeLight": "Light",
  "settings.themeDark": "Dark",
  "settings.language": "Language",
  "settings.langZh": "中文",
  "settings.langEn": "English",
  "settings.fontSize": "Font size: {n}px (Ctrl + wheel)",
  "settings.close": "Close",
  "ctx.cut": "Cut",
  "ctx.copy": "Copy",
  "ctx.paste": "Paste",
  "ctx.insert": "Insert",
  "ctx.format": "Format",
  "ctx.footnote": "Footnote",
  "ctx.table": "Table",
  "ctx.callout": "Callout",
  "ctx.hr": "Horizontal rule",
  "ctx.codeBlock": "Code block",
  "ctx.mathBlock": "Math block",
  "ctx.bold": "Bold",
  "ctx.italic": "Italic",
  "ctx.strike": "Strikethrough",
  "ctx.highlight": "Highlight",
  "ctx.code": "Code",
  "ctx.math": "Math",
  "ctx.comment": "Comment",
  "ctx.clearFormat": "Clear formatting",
  "placeholder.text": "text",
  "tableInsert.title": "Insert table",
  "tableInsert.hint": "Move over the grid to choose columns × rows (including header), then click a cell to insert.",
  "tableInsert.dimensions": "{cols} cols × {rows} rows",
};

const tables: Record<Locale, Record<I18nKey, string>> = { zh, en };

let currentLocale: Locale = "zh";

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
}

export function t(key: I18nKey, params?: Record<string, string | number>): string {
  let s = tables[currentLocale][key] ?? tables.zh[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replace(`{${k}}`, String(v));
    }
  }
  return s;
}

/** 更新带 data-i18n / data-i18n-title / data-i18n-placeholder 的节点 */
export function applyI18nToDom(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n as I18nKey | undefined;
    if (key) el.textContent = t(key);
  });
  root.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach((el) => {
    const key = el.dataset.i18nTitle as I18nKey | undefined;
    if (key) el.title = t(key);
  });
  root.querySelectorAll<HTMLInputElement>("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder as I18nKey | undefined;
    if (key) el.placeholder = t(key);
  });
}
