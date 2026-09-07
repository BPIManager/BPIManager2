/**
 * songs 全般（`/songs/**`、ユーザースコープ外）の subhandler バレル。
 * 実体は API ルート単位のファイルにある。
 */
export type { HandleOutcome } from "./_shared";
export * from "./songsList";
export * from "./songById";
export * from "./arenaAverages";
export * from "./definitions";
export * from "./songRanking";
export * from "./similar";
export * from "./notes";
export * from "./noteDetail";
export * from "./noteUpvote";
export * from "./recentNotes";
export * from "./patterns";
export * from "./patternSearch";
export * from "./patternVote";
