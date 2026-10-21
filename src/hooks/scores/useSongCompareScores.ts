import { useMemo } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { useScoreHistory } from "@/hooks/scores/useScoreLogs";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import type { SongHistoryResponse, SongWithScore } from "@/types/songs/score";

type ScoreSongBase = Pick<SongWithScore, "songId" | "exScore" | "rival">;

const bestInVersion = (
  groups: SongHistoryResponse | undefined,
  version: string,
): number | null => {
  const scores = groups?.[version]?.map((s) => s.exScore ?? 0) ?? [];
  const best = Math.max(0, ...scores);
  return best > 0 ? best : null;
};

/**
 * 他ユーザー(ライバル)のスコア画面から楽曲モーダルを開いたときの、自分/相手それぞれのEXスコアを返す。
 *
 * @param song - モーダルに渡された楽曲(スコアの持ち主は scoreOwnerId、未指定なら自分)
 * @param subjectUserId - 画面で表示中の相手ユーザー(未指定なら比較しない)
 * @param scoreOwnerId - song のスコアの持ち主
 * @param version - 比較対象バージョン(省略時は最新)
 */
export const useSongCompareScores = (
  song: ScoreSongBase | null,
  subjectUserId: string | undefined,
  scoreOwnerId: string | undefined,
  version: string | undefined,
) => {
  const { fbUser } = useUser();
  const viewerId = fbUser?.uid;
  const targetVersion = version ?? latestVersion;
  const enabled = !!song && !!subjectUserId;
  const songOwnedByViewer = !scoreOwnerId || scoreOwnerId === viewerId;
  const songHasRival = songOwnedByViewer && !!song?.rival;

  // song に含まれない側のスコアだけ履歴から補う
  const { historyGroups: myHistory } = useScoreHistory(
    viewerId,
    song?.songId ?? 0,
    enabled && !songOwnedByViewer,
  );
  const { historyGroups: subjectHistory } = useScoreHistory(
    subjectUserId,
    song?.songId ?? 0,
    enabled && songOwnedByViewer && !songHasRival,
  );

  return useMemo(() => {
    if (!enabled || !song) return null;
    const subjectEx = songOwnedByViewer
      ? songHasRival
        ? (song.rival?.exScore ?? null)
        : bestInVersion(subjectHistory, targetVersion)
      : (song.exScore ?? null);
    const myEx = songOwnedByViewer
      ? (song.exScore ?? null)
      : bestInVersion(myHistory, targetVersion);
    return { myEx, subjectEx };
  }, [
    enabled,
    song,
    songOwnedByViewer,
    songHasRival,
    myHistory,
    subjectHistory,
    targetVersion,
  ]);
};
