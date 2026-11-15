// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedSearch } from "@/hooks/common/useDebouncedSearch";

afterEach(() => vi.useRealTimers());

describe("useDebouncedSearch", () => {
  it("外部の確定値が変わるとローカル値も同期する", () => {
    const { result, rerender } = renderHook(
      ({ ext }) => useDebouncedSearch(ext, vi.fn()),
      { initialProps: { ext: "abc" } },
    );
    expect(result.current.localSearch).toBe("abc");
    rerender({ ext: "" });
    expect(result.current.localSearch).toBe("");
  });

  it("入力中は isTyping になり、遅延後に1回だけ onChange へ確定値を伝える", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { result } = renderHook(() => useDebouncedSearch("", onChange, 500));
    act(() => result.current.setLocalSearch("ab"));
    expect(result.current.isTyping).toBe(true);
    act(() => vi.advanceTimersByTime(499));
    expect(onChange).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("ab");
  });

  it("確定値と同じ値には onChange を呼ばない", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    renderHook(() => useDebouncedSearch("same", onChange, 500));
    act(() => vi.advanceTimersByTime(1000));
    expect(onChange).not.toHaveBeenCalled();
  });
});
