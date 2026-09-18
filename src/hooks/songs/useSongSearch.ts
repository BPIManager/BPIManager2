import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import type { RadarCategory } from "@/types/stats/radar";

export interface SongSearchResult {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  bpm: string | null;
  releasedVersion: number | null;
  wrScore: number | null;
  kaidenAvg: number | null;
  coef: number | null;
  mu: number | null;
  sigma: number | null;
  residualVar: number | null;
}

export type BpmBand = "slow" | "mid" | "fast" | "soflan";

/**
 * 楽曲を検索・一覧表示する。`query`が空文字でも常にフェッチする
 * （曲名を介さない一覧表示。`difficultyLevel`・`radarCategory`・`bpmBand`で
 * 絞り込める）。`enabled`が`false`の間はフェッチしない。
 */
export const useSongSearch = (
  query: string,
  options?: {
    difficultyLevel?: number;
    version?: string;
    radarCategory?: RadarCategory;
    bpmBand?: BpmBand;
    enabled?: boolean;
  },
) => {
  const trimmed = query.trim();
  const version = options?.version ?? latestVersion;
  const hasQuery = options?.enabled ?? true;

  const params = new URLSearchParams({ version });
  if (trimmed.length > 0) params.set("title", trimmed);
  if (options?.difficultyLevel !== undefined) {
    params.set("difficultyLevel", String(options.difficultyLevel));
  }
  if (options?.radarCategory) params.set("radarCategory", options.radarCategory);
  if (options?.bpmBand) params.set("bpmBand", options.bpmBand);

  const url = hasQuery ? `${API_V2_PREFIX}/songs/search?${params.toString()}` : null;

  const { data, isLoading, error } = useAuthedSWRV2<SongSearchResult[]>(url, {
    revalidateOnFocus: false,
    dedupingInterval: 300,
  });

  return { songs: data ?? [], isLoading, isError: error };
};
