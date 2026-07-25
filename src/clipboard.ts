import { getSelectedPlainText, replaceSelection } from "./markdown-edit";
import { pastePlainText } from "./editor";
import { resolvePasteFromNavigatorClipboard } from "./paste-resolve";

export function hasEditorSelection(source: HTMLElement): boolean {
  return getSelectedPlainText(source).length > 0;
}

export async function copySelection(source: HTMLElement): Promise<void> {
  const text = getSelectedPlainText(source);
  if (!text) return;
  await navigator.clipboard.writeText(text);
}

export async function cutSelection(source: HTMLElement): Promise<void> {
  const text = getSelectedPlainText(source);
  if (!text) return;
  await navigator.clipboard.writeText(text);
  replaceSelection(source, "");
}

export async function pasteFromClipboard(source: HTMLElement): Promise<void> {
  try {
    const text = await resolvePasteFromNavigatorClipboard();
    if (!text) return;
    pastePlainText(source, text);
  } catch {
    // 无剪贴板权限或读取失败时静默忽略
  }
}
