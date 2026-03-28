import { useEffect, useRef } from "react";

interface UseInfiniteScrollProps {
  /** スクロール末尾が交差したときに呼び出されるコールバック */
  onIntersect: () => void;
  /** データ取得中フラグ（true の間は監視を一時停止） */
  isLoading: boolean;
  /** これ以上データがない場合 true（true の間は監視を停止） */
  isReachingEnd: boolean;
}

/**
 * IntersectionObserver を使った無限スクロールフック。
 * 返却した ref をスクロール末尾のセンチネル要素に付与することで、
 * 要素が画面内に入ったタイミングで `onIntersect` を呼び出す。
 *
 * @param props - {@link UseInfiniteScrollProps}
 * @returns センチネル要素に付与する ref オブジェクト
 */
export const useInfiniteScroll = ({
  onIntersect,
  isLoading,
  isReachingEnd,
}: UseInfiniteScrollProps) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target || isReachingEnd || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [onIntersect, isLoading, isReachingEnd]);

  return observerTarget;
};
