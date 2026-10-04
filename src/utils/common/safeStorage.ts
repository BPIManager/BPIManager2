/** ストレージ無効・ブロック環境（SecurityError等）でも例外を投げない localStorage ラッパー */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 保存できなくても動作は継続する
  }
}
