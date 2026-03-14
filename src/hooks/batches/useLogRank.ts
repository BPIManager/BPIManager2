import { useState, useMemo } from "react";

export const useLogRank = (details: any[], type: "growth" | "top") => {
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
