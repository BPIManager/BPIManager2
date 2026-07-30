import { useMemo } from "react";
import { DashCard } from "@/components/ui/dashcard";
import { Skeleton } from "@/components/ui/skeleton";

export const BpiBoxStatsSkeleton = () => {
  // スケルトンのダミー棒グラフ高さをランダム生成する(表示専用・機能に影響しないため許容)
  const bars = useMemo(
    () =>
      Array.from({ length: 14 }, () => ({
        // eslint-disable-next-line react-hooks/purity
        h1: Math.random() * 30 + 5,
        // eslint-disable-next-line react-hooks/purity
        h2: Math.random() * 20 + 10,
        // eslint-disable-next-line react-hooks/purity
        h3: Math.random() * 15 + 5,
      })),
    [],
  );

  return (
    <DashCard className="h-105">
      <Skeleton className="mb-8 h-4 w-45" />

      <div className="relative mb-6 flex h-65 w-full items-end justify-between px-2">
        {bars.map((bar, i) => (
          <div
            key={i}
            className="flex flex-1 flex-col items-center justify-end gap-0.5"
          >
            <Skeleton
              className="w-2 rounded-sm opacity-20"
              style={{ height: `${bar.h1}%` }}
            />
            <Skeleton
              className="w-2 rounded-sm opacity-40"
              style={{ height: `${bar.h2}%` }}
            />
            <Skeleton
              className="w-2 rounded-sm opacity-20"
              style={{ height: `${bar.h3}%` }}
            />
          </div>
        ))}
      </div>

      <div className="mb-6 flex justify-between px-10">
        <Skeleton className="h-2.5 w-10" />
        <Skeleton className="h-2.5 w-10" />
        <Skeleton className="h-2.5 w-10" />
      </div>

      <div className="px-2">
        <Skeleton className="h-[30px] w-full rounded-md" />
      </div>
    </DashCard>
  );
};
