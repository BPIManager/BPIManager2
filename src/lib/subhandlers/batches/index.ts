/**
 * batches ドメイン（`users/[userId]/batches/**`）の subhandler バレル。
 * 実体は API ルート単位ファイルにある（`[batchId]` の GET/DELETE は detail.ts に同居）。
 */
export type { HandleOutcome } from "./_shared";
export { createOvertakenMap, computeRivalRankMap } from "./_shared";
export * from "./list";
export * from "./detail";
export * from "./scores";
export * from "./versionSummary";
