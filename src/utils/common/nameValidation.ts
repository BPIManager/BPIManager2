import { userNameSchema } from "@/schemas/profile/upsert";

/**
 * ユーザー名の形式チェック
 * @param name ユーザー名
 * @returns { isValid: boolean, message: string | null }
 */
export const validateUserName = (name: string) => {
  const result = userNameSchema.safeParse(name);
  if (!result.success) {
    return {
      isValid: false,
      message: result.error.issues[0]?.message ?? "不正なユーザー名です",
    };
  }
  return { isValid: true, message: null };
};
