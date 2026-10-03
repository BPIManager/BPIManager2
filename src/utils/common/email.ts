const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * メールアドレスを照合用に正規化する（前後の空白除去・小文字化）。
 *
 * @param email - 入力のメールアドレス
 * @returns 正規化済みのメールアドレス
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * 形式だけを確認する簡易チェック。実在性は確認メールのクリックで担保する。
 *
 * @param email - 入力のメールアドレス
 * @returns 形式が妥当な場合 true
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(email));
}
