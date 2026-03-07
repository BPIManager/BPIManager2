import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";
export interface ArenaAverageData {
  title: string;
  difficulty: string;
  notes: number;
  maxScore: number;
  averages: Record<
    string,
    {
      avgExScore: number;
      rate: number;
      count: number;
    }
  >;
}

export const useArenaAverages = (version: string, level: number) => {
  const { data, error, isLoading } = useSWR(
    version && level ? `/data/metrics/arena/${version}_${level}.json` : null,
    fetcher,
  );

  return { averages: data || [], isLoading };
};
