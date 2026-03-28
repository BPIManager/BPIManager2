// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CustomPagination } from "@/components/partials/Pagination/ui";

describe("CustomPagination", () => {
  it("count <= pageSize のとき何もレンダリングしない", () => {
    const { container } = render(
      <CustomPagination
        count={10}
        pageSize={20}
        page={1}
        onPageChange={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("前のページボタンがレンダリングされる", () => {
    render(
      <CustomPagination
        count={100}
        pageSize={10}
        page={3}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("前のページ")).toBeInTheDocument();
    expect(screen.getByLabelText("次のページ")).toBeInTheDocument();
  });

  it("ページ 1 のとき前のページボタンが無効化される", () => {
    render(
      <CustomPagination
        count={100}
        pageSize={10}
        page={1}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("前のページ")).toBeDisabled();
    expect(screen.getByLabelText("次のページ")).not.toBeDisabled();
  });

  it("最終ページのとき次のページボタンが無効化される", () => {
    render(
      <CustomPagination
        count={50}
        pageSize={10}
        page={5}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("次のページ")).toBeDisabled();
  });

  it("現在ページに aria-current='page' が設定される", () => {
    render(
      <CustomPagination
        count={100}
        pageSize={10}
        page={3}
        onPageChange={vi.fn()}
      />,
    );
    const currentPage = screen.getByRole("button", { name: "3" });
    expect(currentPage).toHaveAttribute("aria-current", "page");
  });

  it("ページボタンクリックで onPageChange が呼ばれる", () => {
    const onPageChange = vi.fn();
    render(
      <CustomPagination
        count={100}
        pageSize={10}
        page={3}
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("前のページボタンクリックで page - 1 が渡される", () => {
    const onPageChange = vi.fn();
    render(
      <CustomPagination
        count={100}
        pageSize={10}
        page={5}
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("前のページ"));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("次のページボタンクリックで page + 1 が渡される", () => {
    const onPageChange = vi.fn();
    render(
      <CustomPagination
        count={100}
        pageSize={10}
        page={3}
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("次のページ"));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("7 ページ以下はすべてのページ番号が表示される", () => {
    render(
      <CustomPagination
        count={70}
        pageSize={10}
        page={1}
        onPageChange={vi.fn()}
      />,
    );
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByRole("button", { name: String(i) })).toBeInTheDocument();
    }
  });

  it("8 ページ以上で省略記号（...）が表示される", () => {
    const { container } = render(
      <CustomPagination
        count={100}
        pageSize={10}
        page={5}
        onPageChange={vi.fn()}
      />,
    );
    // MoreHorizontal アイコンが含まれる要素が存在する
    const ellipsis = container.querySelectorAll("svg");
    // ChevronLeft + ChevronRight + MoreHorizontal(s)
    expect(ellipsis.length).toBeGreaterThan(2);
  });
});
