// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

vi.mock("next/router", () => ({ useRouter: () => ({ asPath: "/x" }) }));
vi.mock("next/head", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { Meta } from "@/components/partials/common/PageChrome/Head";

// React 19 は <meta> を document.head へ巻き上げるため、document 全体から探す
const ogImageOf = (_container?: HTMLElement) =>
  document.querySelector('meta[property="og:image"]')?.getAttribute("content");

describe("Meta", () => {
  afterEach(() => cleanup());

  it("OGP画像の既定値は public/icons/ogp.jpg の絶対URLになる", () => {
    const { container } = render(<Meta title="t" />);
    expect(ogImageOf(container)).toBe("https://bpi2.poyashi.me/icons/ogp.jpg");
  });

  it("相対パスの画像は絶対URLにし、絶対URLはそのまま使う", () => {
    render(<Meta ogImage="/a.png" />);
    expect(ogImageOf()).toBe("https://bpi2.poyashi.me/a.png");
    cleanup();
    render(<Meta ogImage="https://example.com/b.png" />);
    expect(ogImageOf()).toBe("https://example.com/b.png");
  });
});
