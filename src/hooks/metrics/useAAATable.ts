import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import { useMemo } from "react";
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
  const { fbUser } = useUser();

  const { data, error, isLoading } = useSWR<AAATableItem[]>(
    userId && version && level
      ? [`/api/${userId}/stats/${version}/aaaDifficulty?level=${level}`, fbUser]
      : null,
    fetcher,
  );

  const groupedData = useMemo(() => {
    if (!data) return {};

    const sortedData = [...data].sort((a, b) => {
      const bpiA = a.targets[goal].targetBpi ?? 0;
      const bpiB = b.targets[goal].targetBpi ?? 0;
      return bpiB - bpiA;
    });

    return sortedData.reduce(
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
  }, [data, goal, mode]);

  return { groupedData, isLoading, isError: error };
};
