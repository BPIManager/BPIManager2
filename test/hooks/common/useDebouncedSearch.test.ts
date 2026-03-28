// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedSearch } from "@/hooks/common/useDebouncedSearch";

describe("useDebouncedSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("初期値が localSearch にセットされる", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearch("initial", onChange),
    );
    expect(result.current.localSearch).toBe("initial");
  });

  it("入力変更後、delay 経過前は onChange が呼ばれない", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDebouncedSearch("", onChange));

    act(() => {
      result.current.setLocalSearch("hello");
    });

    vi.advanceTimersByTime(400);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("delay 経過後に onChange が呼ばれる", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearch("", onChange, 500),
    );

    act(() => {
      result.current.setLocalSearch("test");
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onChange).toHaveBeenCalledWith("test");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("連続入力時は最後の入力のみ onChange を呼ぶ（デバウンス）", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearch("", onChange, 500),
    );

    act(() => {
      result.current.setLocalSearch("a");
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current.setLocalSearch("ab");
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current.setLocalSearch("abc");
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("abc");
  });

  it("isTyping は localSearch と externalValue が異なるとき true", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearch("initial", onChange),
    );

    expect(result.current.isTyping).toBe(false);

    act(() => {
      result.current.setLocalSearch("changed");
    });

    expect(result.current.isTyping).toBe(true);
  });

  it("externalValue が変更されると localSearch も同期される", () => {
    const onChange = vi.fn();
    let externalValue = "first";
    const { result, rerender } = renderHook(() =>
      useDebouncedSearch(externalValue, onChange),
    );

    expect(result.current.localSearch).toBe("first");

    externalValue = "second";
    rerender();

    expect(result.current.localSearch).toBe("second");
  });

  it("localSearch が externalValue と同じ場合は onChange を呼ばない", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearch("same", onChange, 100),
    );

    // localSearch を externalValue と同じ値に設定
    act(() => {
      result.current.setLocalSearch("same");
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});
