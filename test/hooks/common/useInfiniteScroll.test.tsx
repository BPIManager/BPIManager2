// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useInfiniteScroll } from "@/hooks/common/useInfiniteScroll";

// IntersectionObserver のモック
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();

let capturedCallback: IntersectionObserverCallback | null = null;

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [0.1];

  constructor(callback: IntersectionObserverCallback) {
    capturedCallback = callback;
  }
  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

// フックを実際の DOM 要素に接続するラッパーコンポーネント
function Sentinel({
  onIntersect,
  isLoading,
  isReachingEnd,
}: {
  onIntersect: () => void;
  isLoading: boolean;
  isReachingEnd: boolean;
}) {
  const ref = useInfiniteScroll({ onIntersect, isLoading, isReachingEnd });
  return <div ref={ref} data-testid="sentinel" />;
}

describe("useInfiniteScroll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedCallback = null;
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  it("通常状態では IntersectionObserver が登録される", () => {
    render(
      <Sentinel
        onIntersect={vi.fn()}
        isLoading={false}
        isReachingEnd={false}
      />,
    );
    expect(mockObserve).toHaveBeenCalled();
  });

  it("isReachingEnd が true のとき IntersectionObserver が登録されない", () => {
    render(
      <Sentinel onIntersect={vi.fn()} isLoading={false} isReachingEnd={true} />,
    );
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("isLoading が true のとき IntersectionObserver が登録されない", () => {
    render(
      <Sentinel onIntersect={vi.fn()} isLoading={true} isReachingEnd={false} />,
    );
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("要素が交差したとき onIntersect が呼ばれる", () => {
    const onIntersect = vi.fn();
    render(
      <Sentinel
        onIntersect={onIntersect}
        isLoading={false}
        isReachingEnd={false}
      />,
    );

    const sentinel = screen.getByTestId("sentinel");
    capturedCallback?.(
      [
        {
          isIntersecting: true,
          target: sentinel,
        } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    );

    expect(onIntersect).toHaveBeenCalledTimes(1);
  });

  it("isIntersecting が false のとき onIntersect が呼ばれない", () => {
    const onIntersect = vi.fn();
    render(
      <Sentinel
        onIntersect={onIntersect}
        isLoading={false}
        isReachingEnd={false}
      />,
    );

    capturedCallback?.(
      [{ isIntersecting: false } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(onIntersect).not.toHaveBeenCalled();
  });
});
