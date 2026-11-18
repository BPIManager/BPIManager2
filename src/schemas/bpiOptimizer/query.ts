import { z } from "zod";

/** BPI オプティマイザのクエリパラメータの検証スキーマ（検証とエラー応答の原因提示は、ここの定義から出す） */

export const targetBpiQuerySchema = z.object({
  targetBpi: z
    .string()
    .transform(Number)
    .pipe(
      z
        .number()
        .min(-15, "targetBpi must be a number between -15 and 100")
        .max(100, "targetBpi must be a number between -15 and 100"),
    ),
});

/** 未指定は 30 */
export const maxStepsQuerySchema = z.object({
  maxSteps: z.preprocess(
    (v) => (v === undefined ? "30" : v),
    z
      .string()
      .regex(/^\d+$/, "maxSteps must be a number between 1 and 400")
      .transform(Number)
      .pipe(
        z
          .number()
          .min(1, "maxSteps must be a number between 1 and 400")
          .max(400, "maxSteps must be a number between 1 and 400"),
      ),
  ),
});
