import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { fetcherV2 } from "@/services/swr/fetchV2";
import useSWR from "swr";
import type { SongDefinitionRecord } from "@/types/songs/definition";

/**
 * 指定楽曲の定義レコード（バージョン別スコア基準値など）を取得する。
 *
 * @param songId - 楽曲 ID（null / undefined の場合はフェッチしない）
 * @returns 定義レコード配列・ローディング状態・エラー情報
 */
export const useSongDefinitions = (songId: number | null | undefined) => {
  const { data, error, isLoading } = useSWR<SongDefinitionRecord[]>(
    songId != null ? `${API_V2_PREFIX}/songs/${songId}/definitions` : null,
    fetcherV2,
  );

  return {
    definitions: data,
    isLoading,
    isError: error,
  };
};
