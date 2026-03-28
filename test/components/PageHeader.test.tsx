// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  PageHeader,
  PageContainer,
} from "@/components/partials/Header/index";
import { BarChart3 } from "lucide-react";

describe("PageHeader", () => {
  it("title が h1 に表示される", () => {
    render(<PageHeader title="テストページ" />);
    expect(
      screen.getByRole("heading", { name: "テストページ" }),
    ).toBeInTheDocument();
  });

  it("description が表示される", () => {
    render(<PageHeader title="タイトル" description="説明文テキスト" />);
    expect(screen.getByText("説明文テキスト")).toBeInTheDocument();
  });

  it("description を省略した場合は説明文が表示されない", () => {
    render(<PageHeader title="タイトル" />);
    // description 用の p 要素が存在しないことを確認
    expect(screen.queryByText(/description/)).not.toBeInTheDocument();
  });

  it("icon を渡したときアイコンコンテナがレンダリングされる", () => {
    const { container } = render(
      <PageHeader title="タイトル" icon={BarChart3} />,
    );
    // アイコンラッパーの div が存在する
    const iconWrapper = container.querySelector(".rounded-lg.border");
    expect(iconWrapper).toBeInTheDocument();
  });

  it("rightElement が表示される", () => {
    render(
      <PageHeader
        title="タイトル"
        rightElement={<button>右側ボタン</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "右側ボタン" })).toBeInTheDocument();
  });
});

describe("PageContainer", () => {
  it("children がレンダリングされる", () => {
    render(
      <PageContainer>
        <p>コンテンツ</p>
      </PageContainer>,
    );
    expect(screen.getByText("コンテンツ")).toBeInTheDocument();
  });
});
