// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRivalListFilter } from "@/hooks/social/useRivalListFilter";

describe("useRivalListFilter", () => {
  it("デフォルト値が正しい（レベル 11/12・全難易度）", () => {
    const { result } = renderHook(() => useRivalListFilter());
    expect(result.current.levels).toEqual(["11", "12"]);
    expect(result.current.difficulties).toEqual([
      "HYPER",
      "ANOTHER",
      "LEGGENDARIA",
    ]);
  });

  it("handleToggleLevel でレベルが追加・削除される", () => {
    const { result } = renderHook(() => useRivalListFilter());

    // 存在しないレベルを追加
    act(() => {
      result.current.handleToggleLevel("10");
    });
    expect(result.current.levels).toContain("10");

    // 存在するレベルを削除
    act(() => {
      result.current.handleToggleLevel("11");
    });
    expect(result.current.levels).not.toContain("11");
  });

  it("handleToggleDifficulty で難易度が追加・削除される", () => {
    const { result } = renderHook(() => useRivalListFilter());

    // 存在する難易度を削除
    act(() => {
      result.current.handleToggleDifficulty("HYPER");
    });
    expect(result.current.difficulties).not.toContain("HYPER");

    // 再度追加
    act(() => {
      result.current.handleToggleDifficulty("HYPER");
    });
    expect(result.current.difficulties).toContain("HYPER");
  });

  it("複数のトグル操作が独立して機能する", () => {
    const { result } = renderHook(() => useRivalListFilter());

    act(() => {
      result.current.handleToggleLevel("9");
      result.current.handleToggleDifficulty("NORMAL");
    });

    expect(result.current.levels).toContain("9");
    expect(result.current.difficulties).toContain("NORMAL");
  });
});
