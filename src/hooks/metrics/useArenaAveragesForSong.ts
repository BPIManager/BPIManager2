import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import useSWR from "swr";
import { arenaAveragesFetcher } from "@/services/swr/arenaAverages";

export type ArenaAverages = Record<
  string,
  { avgExScore: number; rate: number; count: number; avgBpi?: number }
>;

/**
 * 指定楽曲のアリーナランク別平均スコアを取得する。
 * バックエンドが現在バージョンの静的 JSON を検索して返す。
 * 難易度レベルが 11 / 12 以外の楽曲はデータなし（null）。
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
