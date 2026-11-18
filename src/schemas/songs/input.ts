import { z } from "zod";

/** 曲ノート・パターンの入力の検証スキーマ（検証とエラー応答の原因提示は、ここの定義から出す） */

/** ノート本文。前後の空白を除いて 1〜2000 文字 */
export const noteBodySchema = z.object({
  body: z
    .string("body is required")
    .trim()
    .min(1, "body is required")
    .max(2000, "body too long (max 2000)"),
});

/** パターン一覧のカーソル。未指定・空は 0 */
export const patternCursorQuerySchema = z.object({
  cursor: z.preprocess(
    (v) => (v === undefined || v === "" ? "0" : v),
    z
      .string()
      .regex(/^\d+$/, "cursor must be a non-negative integer")
      .transform(Number),
  ),
});

export const patternVoteBodySchema = z.object({
  voteType: z.enum(["upvote", "downvote"], {
    error: "voteType must be upvote or downvote",
  }),
});
