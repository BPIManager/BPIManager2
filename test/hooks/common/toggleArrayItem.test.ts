import { describe, it, expect } from "vitest";
import { toggleArrayItem } from "@/hooks/common/useToggleArray";

describe("toggleArrayItem", () => {
  it("存在しない要素を追加する", () => {
    expect(toggleArrayItem(["a", "b"], "c")).toEqual(["a", "b", "c"]);
  });

  it("存在する要素を削除する", () => {
    expect(toggleArrayItem(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });

  it("undefined の場合は追加のみ行う", () => {
    expect(toggleArrayItem(undefined, "x")).toEqual(["x"]);
  });

  it("空配列に要素を追加する", () => {
    expect(toggleArrayItem([], "z")).toEqual(["z"]);
  });

  it("数値配列でも動作する", () => {
    expect(toggleArrayItem([1, 2, 3], 2)).toEqual([1, 3]);
    expect(toggleArrayItem([1, 3], 2)).toEqual([1, 3, 2]);
  });

  it("元の配列を変更しない（イミュータブル）", () => {
    const original = ["a", "b"];
    toggleArrayItem(original, "a");
    expect(original).toEqual(["a", "b"]);
  });
});
