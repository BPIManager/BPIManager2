import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import type { SongRankingResponse } from "@/types/users/ranking";

/**
 * useSongRankingQuery の API v2 版。body（SongRankingResponse）を返し、v2 移行済みのランキングエンドポイントでのみ使う。
 *
 * @param songId - 楽曲 ID（null の場合はフェッチしない）
 * @param version - IIDX バージョン（null の場合は最新バージョン）
 * @param buildUrl - ユーザーID・楽曲ID・バージョンからリクエストURLを組み立てる関数
 */
export const useSongRankingQueryV2 = (
  songId: number | null,
  version: string | null,
  buildUrl: (uid: string, songId: number, version: string) => string,
) => {
  const { fbUser } = useUser();

  const url =
    fbUser && songId
      ? buildUrl(fbUser.uid, songId, version || latestVersion)
      : null;
  const { data, isLoading, error } = useAuthedSWRV2<SongRankingResponse>(url, {
    revalidateOnFocus: false,
  });

  return { data, isLoading, isError: error };
};
