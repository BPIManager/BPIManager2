import type { z } from "zod";
import { invalidParams } from "@/middlewares/api/apiResult";
import type { HandlerResult } from "@/types/api";

export type ParseOutcome<T> =
  | { success: true; data: T }
  | { success: false; result: HandlerResult<never> };

/**
 * 入力を zod スキーマで検証する。不正なら 400 の HandlerResult（errorDetails に issues と JSON Schema）を返す。
 * errorMessage は従来の文言（message）をそのまま使う。
 *
 * @param opts.in - 検証する入力の置き場所
 * @param opts.message - 従来どおりの errorMessage（省略時は最初の issue のメッセージ）
 */
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown,
  opts: { in: "path" | "query" | "body"; message?: string },
): ParseOutcome<z.output<S>> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { success: true, data: parsed.data };
  return { success: false, result: invalidParams(parsed.error, schema, opts) };
}
