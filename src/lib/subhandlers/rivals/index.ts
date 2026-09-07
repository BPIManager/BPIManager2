/**
 * rivals ドメイン（`users/[userId]/rivals/**`）の subhandler 群のバレル。
 * 各 handle* は `{ result, targetUserId, viewerId }` を返す。実体は
 * ルート系統ごとの分割ファイルにある。
 */
export type { HandleOutcome } from "./_shared";
export * from "./rivalId";
export * from "./following";
export * from "./followingScores";
export * from "./monthlyReviewSummary";
export * from "./suggestions";
