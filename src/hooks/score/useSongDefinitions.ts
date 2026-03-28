import { API_PREFIX } from "@/constants/apiEndpoints";
import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";
import type { SongDefinitionRecord } from "@/pages/api/v1/songs/[songId]/definitions";

/**
 * 指定楽曲の定義レコード（バージョン別スコア基準値など）を取得する。
 *
 * @param songId - 楽曲 ID（null / undefined の場合はフェッチしない）
 * @returns 定義レコード配列・ローディング状態・エラー情報
 */
export const useSongDefinitions = (songId: number | null | undefined) => {
  const { data, error, isLoading } = useSWR<SongDefinitionRecord[]>(
    songId != null ? `${API_PREFIX}/songs/${songId}/definitions` : null,
    fetcher,
  );

  return {
    definitions: data,
    isLoading,
    isError: error,
  };
};
