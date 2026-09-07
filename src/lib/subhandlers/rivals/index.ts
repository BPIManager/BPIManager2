/**
 * rivals ドメイン（`users/[userId]/rivals/**`）の subhandler バレル。
 * 実体は API ルート単位のファイルにある。
 */
export type { HandleOutcome } from "./_shared";
export * from "./rivalScores";
export * from "./rivalScoreDetail";
export * from "./winLossHistory";
export * from "./followingAvgScores";
export * from "./followingList";
export * from "./followingSummary";
export * from "./followingTopScores";
export * from "./followingScoresList";
export * from "./followingScoreForSong";
export * from "./monthlyReviewSummary";
export * from "./suggestions";
