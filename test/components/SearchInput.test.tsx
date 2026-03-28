// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchInput } from "@/components/partials/UserList/Filter/searchInput";

describe("SearchInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initialValue が input に表示される", () => {
    render(<SearchInput initialValue="test" onSearch={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("test");
  });

  it("空文字で初期化できる", () => {
    render(<SearchInput initialValue="" onSearch={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("入力変更後、500ms 経過前は onSearch が呼ばれない", () => {
    const onSearch = vi.fn();
    render(<SearchInput initialValue="" onSearch={onSearch} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "abc" } });
    vi.advanceTimersByTime(400);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("500ms 後に onSearch が呼ばれる", () => {
    const onSearch = vi.fn();
    render(<SearchInput initialValue="" onSearch={onSearch} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "query" },
    });
    vi.advanceTimersByTime(500);
    expect(onSearch).toHaveBeenCalledWith("query");
  });

  it("連続入力時は最後の値のみ onSearch が呼ばれる", () => {
    const onSearch = vi.fn();
    render(<SearchInput initialValue="" onSearch={onSearch} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "a" } });
    vi.advanceTimersByTime(200);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "ab" } });
    vi.advanceTimersByTime(200);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "abc" } });
    vi.advanceTimersByTime(500);

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("abc");
  });

  it("initialValue と同じ値に変えても onSearch は呼ばれない", () => {
    const onSearch = vi.fn();
    render(<SearchInput initialValue="same" onSearch={onSearch} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "same" } });
    vi.advanceTimersByTime(500);
    expect(onSearch).not.toHaveBeenCalled();
  });
});
