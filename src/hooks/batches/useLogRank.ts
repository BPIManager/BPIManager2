import { useState, useMemo } from "react";
import { BatchDetailItem } from "./useBatchDetail";

/**
 * バッチ詳細の楽曲一覧をソート・ページングして返す。
 *
 * @param details - バッチ詳細アイテム配列
 * @param type - 並び替え種別。`"growth"` は BPI 成長順、`"top"` は BPI 上位順、`"overtake"` は抜かれた楽曲
 * @returns 表示対象の楽曲・ページング操作関数・新記録非表示フラグ
 */
export const useLogRank = (
  details: BatchDetailItem[],
  type: "growth" | "top" | "overtake",
) => {
  const [displayLimit, setDisplayLimit] = useState(5);
  const [hideNewRecords, setHideNewRecords] = useState(false);

  const sortedSongs = useMemo(() => {
    return [...details]
      .filter((d) => {
        if (type === "growth") return d.diff && d.diff.bpi > 0;
        return d.current && d.current.bpi !== null;
      })
      .filter((d) => (hideNewRecords ? !!d.previous : true))
      .sort((a, b) => {
        if (type === "growth") return b.diff.bpi - a.diff.bpi;
        return b.current.bpi - a.current.bpi;
      });
  }, [details, hideNewRecords, type]);

  const visibleSongs = sortedSongs.slice(0, displayLimit);
  const hasMore = sortedSongs.length > displayLimit;
  const remainingCount = sortedSongs.length - displayLimit;

  const loadMore = () => setDisplayLimit((prev) => prev + 10);

  return {
    visibleSongs,
    hasMore,
    remainingCount,
    loadMore,
    hideNewRecords,
    setHideNewRecords,
    setDisplayLimit,
  };
};
