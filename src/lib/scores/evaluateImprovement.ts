import { isImproved } from "@/lib/lamp";

export interface ScoreImprovementCandidate {
  exScore: number;
  clearState: string;
  missCount?: number | null;
}

export interface CurrentScoreForImprovement {
  exScore: number;
  clearState: string | null;
  missCount: number | null;
}

/**
 * 新しい記録が既存の自己ベスト（EXスコア・クリアランプ・ミスカウント）のいずれかを上回るかを判定する。
 * 過去の記録での誤上書きを防ぐため、CSV（scores/bulk.ts）・MCP（updateMyScore.ts）双方の書き込み前に必ず通す。
 *
 * @param candidate - 判定対象の新しい記録
 * @param current - 既存の自己ベスト（未プレイの場合は undefined）
 */
export function isScoreImproved(
  candidate: ScoreImprovementCandidate,
  current: CurrentScoreForImprovement | undefined,
): boolean {
  if (!candidate.exScore || candidate.exScore <= 0) return false;

  const scoreBetter = candidate.exScore > (current?.exScore ?? 0);
  const lampBetter = isImproved(
    candidate.clearState,
    current?.clearState ?? null,
  );
  const currentMiss = current?.missCount ?? Infinity;
  const missBetter =
    candidate.missCount != null && candidate.missCount < currentMiss;

  return scoreBetter || lampBetter || missBetter;
}
