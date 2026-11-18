import { describe, it, expect } from "vitest";
import { validateUserName } from "@/utils/common/nameValidation";
import { userNameSchema } from "@/schemas/profile/upsert";

describe("ユーザー名の検証", () => {
  it("API のスキーマのメッセージは英語", () => {
    const r = userNameSchema.safeParse("a");
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("userName must be 2 to 20 characters");
  });

  it("画面向けの検証メッセージは従来どおり日本語", () => {
    expect(validateUserName("a")).toEqual({
      isValid: false,
      message: "ユーザー名は2文字以上20文字以内で入力してください",
    });
    expect(validateUserName("a/b").message).toContain("使用できない記号");
    expect(validateUserName("ok-name").isValid).toBe(true);
  });
});
