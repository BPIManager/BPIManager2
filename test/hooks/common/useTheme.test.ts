// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  THEMES,
  STORAGE_KEY,
  DEFAULT_THEME,
  getStoredTheme,
  applyTheme,
} from "@/hooks/common/useTheme";

describe("THEMES 定義", () => {
  it("各テーマに必要なフィールドが揃っている", () => {
    for (const t of THEMES) {
      expect(t.id).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(["dark", "light"]).toContain(t.mode);
      expect(t.preview.primary).toBeTruthy();
    }
  });

  it("id はすべて一意", () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getStoredTheme", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("未保存の場合はデフォルトテーマを返す", () => {
    expect(getStoredTheme()).toBe(DEFAULT_THEME);
  });

  it("有効な値が保存されている場合はそれを返す", () => {
    localStorage.setItem(STORAGE_KEY, "light-blue");
    expect(getStoredTheme()).toBe("light-blue");
  });

  it("無効な値が保存されている場合はデフォルトを返す", () => {
    localStorage.setItem(STORAGE_KEY, "invalid-theme");
    expect(getStoredTheme()).toBe(DEFAULT_THEME);
  });
});

describe("applyTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
  });

  it("html に mode クラスと data-theme 属性を設定する", () => {
    applyTheme("light-blue");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.getAttribute("data-theme")).toBe(
      "light-blue",
    );
  });

  it("dark テーマの場合は dark クラスを設定する", () => {
    applyTheme("dark-green");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("localStorage に保存される", () => {
    applyTheme("dark-red");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark-red");
  });

  it("テーマ切り替え時に古い mode クラスが除去される", () => {
    applyTheme("dark-blue");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    applyTheme("light-green");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });
});
