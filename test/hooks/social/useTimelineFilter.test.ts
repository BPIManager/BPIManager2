// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimelineFilter } from "@/hooks/social/useTimelineFilter";

describe("useTimelineFilter", () => {
  it("デフォルト値が正しい", () => {
    const { result } = renderHook(() => useTimelineFilter());
    expect(result.current.mode).toBe("all");
    expect(result.current.filterParams.levels).toEqual([11, 12]);
    expect(result.current.filterParams.difficulties).toEqual([
      "HYPER",
      "ANOTHER",
      "LEGGENDARIA",
    ]);
    expect(result.current.filterParams.search).toBe("");
  });

  it("setMode でモードが変更される", () => {
    const { result } = renderHook(() => useTimelineFilter());

    act(() => {
      result.current.setMode("following");
    });

    expect(result.current.mode).toBe("following");
  });

  it("toggleLevel でレベルが追加・削除される", () => {
    const { result } = renderHook(() => useTimelineFilter());

    // 存在しないレベルを追加
    act(() => {
      result.current.toggleLevel(10);
    });
    expect(result.current.filterParams.levels).toContain(10);

    // 存在するレベルを削除
    act(() => {
      result.current.toggleLevel(11);
    });
    expect(result.current.filterParams.levels).not.toContain(11);
  });

  it("toggleDifficulty で難易度が追加・削除される", () => {
    const { result } = renderHook(() => useTimelineFilter());

    act(() => {
      result.current.toggleDifficulty("HYPER");
    });
    expect(result.current.filterParams.difficulties).not.toContain("HYPER");

    act(() => {
      result.current.toggleDifficulty("BEGINNER");
    });
    expect(result.current.filterParams.difficulties).toContain("BEGINNER");
  });

  it("updateParams で部分的にパラメータを更新できる", () => {
    const { result } = renderHook(() => useTimelineFilter());

    act(() => {
      result.current.updateParams({ search: "keyword" });
    });

    expect(result.current.filterParams.search).toBe("keyword");
    // 他のパラメータは変更されていない
    expect(result.current.filterParams.levels).toEqual([11, 12]);
  });
});
