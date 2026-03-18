import { useCallback, ReactNode } from "react";
import { useInfiniteScroll } from "@/hooks/common/useInfiniteScroll";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface InfiniteScrollContainerProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  isLoadingMore: boolean;
  isReachingEnd: boolean;
  setSize: (size: number | ((size: number) => number)) => void;
  maxH?: string;
  emptyMessage?: string;
  header?: React.ReactNode;
  className?: string;
}

export function InfiniteScrollContainer<T>({
  items,
  renderItem,
  isLoadingMore,
  isReachingEnd,
  setSize,
  maxH = "500px",
  emptyMessage = "データが見つかりませんでした",
  header,
  className,
}: InfiniteScrollContainerProps<T>) {
  const handleIntersect = useCallback(() => {
    setSize((prev) => (typeof prev === "number" ? prev + 1 : 1));
  }, [setSize]);

  const observerTarget = useInfiniteScroll({
    onIntersect: handleIntersect,
    isLoading: isLoadingMore,
    isReachingEnd,
  });

  return (
    <div
      className={cn(
        "flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent",
        className,
      )}
      style={{ maxHeight: maxH }}
    >
      {header && <div className="sticky top-0 z-10 bg-[#0d1117]">{header}</div>}

      <div className="flex flex-col">
        {items.map((item, i) => renderItem(item, i))}
      </div>

      <div
        ref={observerTarget}
        className="flex min-h-[40px] items-center justify-center py-4"
      >
        {isLoadingMore && (
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        )}
        {!isLoadingMore && isReachingEnd && items.length > 0 && (
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">
            全てのデータを読み込みました
          </span>
        )}
      </div>

      {!isLoadingMore && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
