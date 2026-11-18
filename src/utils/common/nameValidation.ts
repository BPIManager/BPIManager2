import { USER_NAME_MESSAGES, userNameSchema } from "@/schemas/profile/upsert";

/** 画面（ユーザー名の入力確認）に出す日本語。スキーマ側のメッセージ（英語）と対応づける */
const USER_NAME_MESSAGES_JA: Record<string, string> = {
  [USER_NAME_MESSAGES.length]: "ユーザー名は2文字以上20文字以内で入力してください",
  [USER_NAME_MESSAGES.forbiddenSymbols]: "使用できない記号（/ や \\ など）が含まれています",
  [USER_NAME_MESSAGES.invalidCharacters]: "名前に使用できない特殊な文字が含まれています",
};

/**
 * ユーザー名の形式チェック
 * @param name ユーザー名
 * @returns { isValid: boolean, message: string | null }（message は画面向けの日本語）
 */
export const validateUserName = (name: string) => {
  const result = userNameSchema.safeParse(name);
  if (!result.success) {
    const message = result.error.issues[0]?.message;
    return {
      isValid: false,
      message: (message && USER_NAME_MESSAGES_JA[message]) || "不正なユーザー名です",
    };
  }
  return { isValid: true, message: null };
};
