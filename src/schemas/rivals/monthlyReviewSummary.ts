import { z } from "zod";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";

/** ライバルの月間レビュー要約のクエリ（検証とエラー応答の原因提示は、ここの定義から出す） */

/** 3 つとも指定されていること */
export const monthlyReviewRequiredSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  month: z.string().min(1, "month is required"),
  version: z.string().min(1, "version is required"),
});

/** month は all / YYYY / YYYY-MM、version は対応バージョン */
export const monthlyReviewValueSchema = z.object({
  month: z.union([
    z.literal("all"),
    z.string().regex(/^\d{4}$/),
    z.string().regex(/^\d{4}-\d{2}$/),
  ], { error: "month must be all, YYYY or YYYY-MM" }),
  version: z.enum(IIDX_VERSIONS, { error: `version must be one of ${IIDX_VERSIONS.join(", ")}` }),
});
