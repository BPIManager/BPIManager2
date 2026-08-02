import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import type { SongRankingResponse } from "@/types/users/ranking";

/**
 * 楽曲別ランキング取得フックの共通実装。
 *
 * `useSongRanking`(scoresドメイン)・`useAllSongRanking`(allScoresドメイン)は
 * 参照先エンドポイントのパスのみが異なりロジックがほぼ同一のため、
 * URL組み立てを`buildUrl`として引数化しここに集約する。
 *
 * @param songId - 楽曲 ID（null の場合はフェッチしない）
 * @param version - IIDX バージョン（null の場合は最新バージョン）
 * @param buildUrl - ユーザーID・楽曲ID・バージョンからリクエストURLを組み立てる関数
 */
export const useSongRankingQuery = (
  songId: number | null,
  version: string | null,
  buildUrl: (uid: string, songId: number, version: string) => string,
) => {
  const { fbUser } = useUser();

  const url =
    fbUser && songId
      ? buildUrl(fbUser.uid, songId, version || latestVersion)
      : null;
  const { data, isLoading, error } = useAuthedSWR<SongRankingResponse>(url, {
    revalidateOnFocus: false,
  });

  return { data, isLoading, isError: error };
};
