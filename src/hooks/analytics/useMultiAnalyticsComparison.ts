import { useEffect, useState } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { MAX_COMPARISON_TARGETS } from "@/constants/logic/analyticsComparison";
import type { AnalyticsTarget } from "@/types/analytics";
import type { SongWithScore } from "@/types/songs/score";
import {
  resolveTarget,
  songKey,
  targetKey,
  type MultiTargetValue,
} from "./resolveMultiTargets";

export interface SongWithMultiTargets extends SongWithScore {
  /** targetKey(target) -> その楽曲におけるターゲットのEX/BPI */
  targets: Record<string, MultiTargetValue>;
}

interface State {
  songs: SongWithMultiTargets[] | undefined;
  isLoading: boolean;
  error: Error | undefined;
}

/**
 * 複数の`AnalyticsTarget`(種類を問わず組み合わせ可)を選択した場合の
 * 比較ページ用データフック(#287)。
 *
 * `useAnalyticsComparison`(単一ターゲット版)が`kind`ごとに使い分けている
 * 既存のAPIエンドポイントをそのまま`resolveTarget`経由で再利用し、選択
 * した全ターゲット分を並列に取得して1つの表にまとめる。SWRの
 * 条件付きフック呼び出しはターゲット数に応じて呼び出し回数が変わり
 * Hooksのルールに反するため、ここでは`useEffect` + 素の`fetch`で
 * 組み立てる（`targets.length <= 1`の場合は呼び出し元が既存の
 * `useAnalyticsComparison`を使うため、このフックは2件以上の場合のみ使う）。
 *
 * @param targets - 選択中のターゲット配列（2件以上を想定）
 * @param version - IIDX バージョン
 */
export const useMultiAnalyticsComparison = (
  targets: AnalyticsTarget[],
  version: string,
): State => {
  const { user, fbUser } = useUser();
  const myUserId = user?.userId;
  // UI側の上限(チェックボックス無効化)をすり抜けて渡された場合の防御
  const cappedTargets = targets.slice(0, MAX_COMPARISON_TARGETS - 1);
  const targetsSignature = cappedTargets.map(targetKey).join(",");

  const [state, setState] = useState<State>({
    songs: undefined,
    isLoading: true,
    error: undefined,
  });

  useEffect(() => {
    if (!myUserId || !fbUser || cappedTargets.length === 0) {
      setState({ songs: undefined, isLoading: false, error: undefined });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

    (async () => {
      try {
        const res = await authFetch(
          `${API_PREFIX}/users/${myUserId}/scores?version=${version}`,
          "GET",
          fbUser,
        );
        if (!res.ok) throw new Error("Failed to fetch my scores");
        const myScores: SongWithScore[] = await res.json();

        const resolved = await Promise.all(
          cappedTargets.map((t) =>
            resolveTarget(myUserId, t, version, myScores, fbUser),
          ),
        );

        if (cancelled) return;

        const songs: SongWithMultiTargets[] = myScores.map((s) => {
          const key = songKey(s);
          const targetValues: Record<string, MultiTargetValue> = {};
          cappedTargets.forEach((t, i) => {
            targetValues[targetKey(t)] = resolved[i].get(key) ?? {
              exScore: null,
              bpi: null,
            };
          });
          return { ...s, targets: targetValues };
        });

        setState({ songs, isLoading: false, error: undefined });
      } catch (err) {
        if (!cancelled) {
          setState({
            songs: undefined,
            isLoading: false,
            error: err instanceof Error ? err : new Error("Unknown error"),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // targetsSignatureで内容の変化のみを追跡する(配列参照の変化では再実行しない)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myUserId, fbUser, version, targetsSignature]);

  return state;
};
