import { describe, it, expect } from "vitest";
import { getArenaClassColor } from "@/utils/arenaClass";
import { formatIIDXId } from "@/utils/common/formatIidxId";
import { validateUserName } from "@/utils/common/nameValidation";
import { parseArray } from "@/utils/common/parseArray";
import { timingSafeEqual } from "@/utils/common/timingSafeEqual";

describe("getArenaClassColor", () => {
  it("既知のクラスに対応する色を返すこと", () => {
    const color = getArenaClassColor("A1");
    expect(color.text).toBe("#fbbf24");
  });

  it("未知のクラス文字列の場合デフォルト色を返すこと", () => {
    const color = getArenaClassColor("UNKNOWN");
    expect(color.text).toBe("#9ca3af");
  });

  it("null/undefinedの場合デフォルト色を返すこと", () => {
    expect(getArenaClassColor(null).text).toBe("#9ca3af");
    expect(getArenaClassColor(undefined).text).toBe("#9ca3af");
  });
});

describe("formatIIDXId", () => {
  it("8桁の数字をXXXX-XXXX形式に変換すること", () => {
    expect(formatIIDXId("12345678")).toBe("1234-5678");
  });

  it("8桁でない場合はそのまま返すこと", () => {
    expect(formatIIDXId("1234567")).toBe("1234567");
  });

  it("undefinedの場合は空文字を返すこと", () => {
    expect(formatIIDXId(undefined)).toBe("");
  });
});

describe("validateUserName", () => {
  it("2〜20文字の通常の名前は有効と判定すること", () => {
    expect(validateUserName("テストユーザー")).toEqual({
      isValid: true,
      message: null,
    });
  });

  it("1文字以下は無効と判定すること", () => {
    const result = validateUserName("a");
    expect(result.isValid).toBe(false);
  });

  it("21文字以上は無効と判定すること", () => {
    const result = validateUserName("a".repeat(21));
    expect(result.isValid).toBe(false);
  });

  it("禁止記号を含む場合は無効と判定すること", () => {
    const result = validateUserName("user/name");
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("使用できない記号");
  });

  it("許可パターン外の特殊文字を含む場合は無効と判定すること", () => {
    const result = validateUserName("user©name");
    expect(result.isValid).toBe(false);
  });
});

describe("parseArray", () => {
  it("配列はそのまま返すこと", () => {
    expect(parseArray([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("非配列の値は1要素配列にラップすること", () => {
    expect(parseArray("a")).toEqual(["a"]);
  });

  it("undefined/nullは空配列を返すこと", () => {
    expect(parseArray(undefined)).toEqual([]);
    expect(parseArray(null)).toEqual([]);
  });

  it("空文字は空配列を返すこと(falsy)", () => {
    expect(parseArray("")).toEqual([]);
  });
});

describe("timingSafeEqual", () => {
  it("同じ文字列の場合trueを返すこと", () => {
    expect(timingSafeEqual("secret-key", "secret-key")).toBe(true);
  });

  it("異なる文字列の場合falseを返すこと", () => {
    expect(timingSafeEqual("secret-key", "other-key!")).toBe(false);
  });

  it("長さが異なる場合falseを返すこと(crypto.timingSafeEqualを呼ばずに)", () => {
    expect(timingSafeEqual("short", "much-longer-string")).toBe(false);
  });

  it("空文字同士はtrueを返すこと", () => {
    expect(timingSafeEqual("", "")).toBe(true);
  });
});
