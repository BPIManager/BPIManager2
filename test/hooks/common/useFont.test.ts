// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  FONTS,
  FONT_STORAGE_KEY,
  DEFAULT_FONT,
  getStoredFont,
  applyFont,
} from "@/hooks/common/useFont";

describe("FONTS 定義", () => {
  it("各フォントに必要なフィールドが揃っている", () => {
    for (const f of FONTS) {
      expect(f.id).toBeTruthy();
      expect(f.label).toBeTruthy();
      expect(f.cssFamily).toBeTruthy();
    }
  });

  it("id はすべて一意", () => {
    const ids = FONTS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("default フォントは googleParam が null", () => {
    const defaultFont = FONTS.find((f) => f.id === "default");
    expect(defaultFont?.googleParam).toBeNull();
  });
});

describe("getStoredFont", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("未保存の場合はデフォルトフォントを返す", () => {
    expect(getStoredFont()).toBe(DEFAULT_FONT);
  });

  it("有効な値が保存されている場合はそれを返す", () => {
    localStorage.setItem(FONT_STORAGE_KEY, "mplus");
    expect(getStoredFont()).toBe("mplus");
  });

  it("無効な値が保存されている場合はデフォルトを返す", () => {
    localStorage.setItem(FONT_STORAGE_KEY, "unknown-font");
    expect(getStoredFont()).toBe(DEFAULT_FONT);
  });
});

describe("applyFont", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty("--bpim-font-family");
  });

  it("CSS カスタムプロパティにフォントファミリーが設定される", () => {
    applyFont("mplus");
    const family = document.documentElement.style.getPropertyValue(
      "--bpim-font-family",
    );
    expect(family).toContain("M PLUS Rounded 1c");
  });

  it("localStorage にフォント ID が保存される", () => {
    applyFont("noto-sans-jp");
    expect(localStorage.getItem(FONT_STORAGE_KEY)).toBe("noto-sans-jp");
  });

  it("default フォントを適用しても Google Fonts の link タグが追加されない", () => {
    applyFont("default");
    const link = document.getElementById("bpim2-gfont-default");
    expect(link).toBeNull();
  });

  it("Google フォントを適用すると link タグが追加される", () => {
    applyFont("mplus");
    const link = document.getElementById("bpim2-gfont-mplus");
    expect(link).not.toBeNull();
    expect(link?.tagName).toBe("LINK");
  });
});
