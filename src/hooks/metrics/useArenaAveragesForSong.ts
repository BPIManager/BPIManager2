import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import type { ArenaAverages } from "@/types/songs/arenaAverages";
import useSWR from "swr";
import { arenaAveragesFetcher } from "@/services/swr/songs/arenaAverages";

/**
 * 指定楽曲のアリーナランク別平均スコアを、現在バージョンの静的 JSON から取得する。難易度 11/12 以外はデータなし（null）。
 *
 * @param songId - 楽曲ID（null の場合は未フェッチ）
 * @returns アリーナランク別平均スコアデータ・ローディング状態
 */
export const useArenaAveragesForSong = (songId: number | null) => {
  const { data, isLoading } = useSWR<ArenaAverages | null>(
    songId != null ? `${API_V2_PREFIX}/songs/${songId}/arena-averages` : null,
    arenaAveragesFetcher,
  );

  return { arenaAverages: data ?? null, isLoading };
};
