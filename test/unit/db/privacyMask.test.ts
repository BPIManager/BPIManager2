import { describe, it, expect } from "vitest";
import { maskPrivateIdentity } from "@/lib/db/shared/privacyMask";

describe("maskPrivateIdentity", () => {
  it("公開ユーザーの場合はそのままの値を返すこと", () => {
    const result = maskPrivateIdentity({
      isPublic: 1,
      userId: "user-1",
      userName: "太郎",
      profileImage: "https://example.com/a.png",
      anonId: "anon-0",
    });
    expect(result).toEqual({
      userId: "user-1",
      userName: "太郎",
      profileImage: "https://example.com/a.png",
    });
  });

  it("非公開ユーザーの場合はanonIdと\"-\"、nullでマスクすること", () => {
    const result = maskPrivateIdentity({
      isPublic: 0,
      userId: "user-1",
      userName: "太郎",
      profileImage: "https://example.com/a.png",
      anonId: "anon-0",
    });
    expect(result).toEqual({
      userId: "anon-0",
      userName: "-",
      profileImage: null,
    });
  });

  it("isPublicがfalseの場合もマスクすること", () => {
    const result = maskPrivateIdentity({
      isPublic: false,
      userId: "user-1",
      userName: "太郎",
      profileImage: null,
      anonId: "anon-1",
    });
    expect(result.userId).toBe("anon-1");
  });
});
