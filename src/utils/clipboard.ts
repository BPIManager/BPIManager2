/**
 * iOS Safari では Clipboard API がユーザーインタラクション外や権限なしで失敗する。
 * null を返すことで呼び出し側が「手動ペーストを促す」処理に分岐できる。
 */
export const safeClipboardRead = async (): Promise<string | null> => {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
};

/** クリップボードのクリア */
export const safeClipboardClear = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText("");
  } catch {}
};
