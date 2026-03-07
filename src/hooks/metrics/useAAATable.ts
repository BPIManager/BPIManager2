import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";

export type GroupingMode = "target" | "self";
export interface AAATableTarget {
  exScore: number;
  targetBpi: number;
  diff: number;
}

export interface AAATableItem {
  songId: number;
  title: string;
  difficulty: string;
  notes: number;
  maxScore: number;
  targets: {
    aaa: AAATableTarget;
    maxMinus: AAATableTarget;
  };
  user: {
    exScore: number;
    bpi: number;
    isAaa: boolean;
    isMaxMinus: boolean;
  };
}

export const useAAATable = (
  userId: string | undefined,
  version: string,
  level: number,
  goal: "aaa" | "maxMinus",
  mode: GroupingMode,
) => {
  const { data, error, isLoading } = useSWR<AAATableItem[]>(
    userId && version && level
      ? `/api/${userId}/stats/${version}/aaaDifficulty?level=${level}`
      : null,
    fetcher,
  );

  const groupedData = data?.reduce(
    (acc: Record<number, AAATableItem[]>, item) => {
      let bpiValue: number;

      if (mode === "self") {
        bpiValue = item.user.bpi;
      } else {
        bpiValue = item.targets[goal].targetBpi ?? 0;
      }

      const bpiFloor = Math.floor(bpiValue / 10) * 10;
      const key = Math.max(-10, Math.min(90, bpiFloor));

      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<number, AAATableItem[]>,
  );

  return { groupedData: groupedData || {}, isLoading, isError: error };
};
