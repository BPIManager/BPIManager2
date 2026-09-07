/**
 * profile / account ドメインの subhandler バレル。
 * 実体は read（GET）/ write（POST/PATCH/DELETE）に分かれている。
 */
export type { HandleOutcome } from "./_shared";
export * from "./read";
export * from "./write";
