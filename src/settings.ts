import { applyI18nToDom, setLocale, t, type Locale } from "./i18n";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "fast-md-settings";

export type AppSettings = {
  theme: ThemeMode;
  locale: Locale;
  fontSize: number;
};

const DEFAULTS: AppSettings = {
  theme: "light",
  locale: "zh",
  fontSize: 16,
};

const FONT_MIN = 12;
const FONT_MAX = 36;

let settings: AppSettings = { ...DEFAULTS };

export function getSettings(): Readonly<AppSettings> {
  return settings;
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      settings = {
        theme: parsed.theme === "dark" ? "dark" : "light",
        locale: parsed.locale === "en" ? "en" : "zh",
        fontSize: clampFontSize(Number(parsed.fontSize) || DEFAULTS.fontSize),
      };
    }
  } catch {
    settings = { ...DEFAULTS };
  }
  applySettings();
  return settings;
}

export function saveSettings(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function setTheme(theme: ThemeMode): void {
  settings.theme = theme;
  document.documentElement.dataset.theme = theme;
  saveSettings();
  syncSettingsForm();
}

export function setAppLocale(locale: Locale): void {
  settings.locale = locale;
  setLocale(locale);
  applyI18nToDom();
  updateFontSizeLabel();
  saveSettings();
  syncSettingsForm();
  window.dispatchEvent(new CustomEvent("fast-md:locale"));
}

export function clampFontSize(n: number): number {
  if (Number.isNaN(n)) return DEFAULTS.fontSize;
  return Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(n)));
}

export function setFontSize(px: number): void {
  settings.fontSize = clampFontSize(px);
  document.documentElement.style.setProperty("--app-font-size", `${settings.fontSize}px`);
  updateFontSizeLabel();
  saveSettings();
}

export function adjustFontSize(delta: number): void {
  setFontSize(settings.fontSize + delta);
}

function applySettings(): void {
  document.documentElement.dataset.theme = settings.theme;
  setLocale(settings.locale);
  document.documentElement.style.setProperty("--app-font-size", `${settings.fontSize}px`);
  applyI18nToDom();
  updateFontSizeLabel();
}

function updateFontSizeLabel(): void {
  const el = document.getElementById("settings-font-size-label");
  if (el) el.textContent = t("settings.fontSize", { n: settings.fontSize });
}

function syncSettingsForm(): void {
  const themeLight = document.getElementById("settings-theme-light") as HTMLInputElement | null;
  const themeDark = document.getElementById("settings-theme-dark") as HTMLInputElement | null;
  const langZh = document.getElementById("settings-lang-zh") as HTMLInputElement | null;
  const langEn = document.getElementById("settings-lang-en") as HTMLInputElement | null;
  if (themeLight) themeLight.checked = settings.theme === "light";
  if (themeDark) themeDark.checked = settings.theme === "dark";
  if (langZh) langZh.checked = settings.locale === "zh";
  if (langEn) langEn.checked = settings.locale === "en";
}

export function setupSettingsModal(): void {
  const modal = document.getElementById("settings-modal");
  const btnOpen = document.getElementById("btn-settings");
  const btnClose = document.getElementById("settings-close");
  const backdrop = modal?.querySelector(".settings-modal__backdrop");

  btnOpen?.addEventListener("click", () => {
    syncSettingsForm();
    updateFontSizeLabel();
    modal?.classList.remove("hidden");
  });

  const close = () => modal?.classList.add("hidden");
  btnClose?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);

  document.getElementById("settings-theme-light")?.addEventListener("change", (e) => {
    if ((e.currentTarget as HTMLInputElement).checked) setTheme("light");
  });
  document.getElementById("settings-theme-dark")?.addEventListener("change", (e) => {
    if ((e.currentTarget as HTMLInputElement).checked) setTheme("dark");
  });
  document.getElementById("settings-lang-zh")?.addEventListener("change", (e) => {
    if ((e.currentTarget as HTMLInputElement).checked) setAppLocale("zh");
  });
  document.getElementById("settings-lang-en")?.addEventListener("change", (e) => {
    if ((e.currentTarget as HTMLInputElement).checked) setAppLocale("en");
  });
}

/** Ctrl + 滚轮：在编辑区缩放字号 */
export function setupFontZoom(wheelRoot: HTMLElement): void {
  wheelRoot.addEventListener(
    "wheel",
    (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1 : -1;
      adjustFontSize(delta);
    },
    { passive: false },
  );
}
