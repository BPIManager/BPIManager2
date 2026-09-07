/**
 * songs 全般（`/songs/**`、ユーザースコープ外）の subhandler バレル。
 * 実体は責務ごとの分割ファイルにある。
 */
export type { HandleOutcome } from "./_shared";
export * from "./song";
export * from "./notes";
export * from "./patterns";
