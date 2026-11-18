import { z } from "zod";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";

/** stats 系ルート（v2）のクエリの検証スキーマ（検証とエラー応答の原因提示は、ここの定義から出す） */

const versionEnum = z.enum(IIDX_VERSIONS, {
  error: `version must be one of ${IIDX_VERSIONS.join(", ")}`,
});

const nonEmpty = (name: string) => z.string(`${name} is required`).min(1, `${name} is required`);

export const availablePeriodsQuerySchema = z.object({
  userId: nonEmpty("userId"),
  version: nonEmpty("version"),
});

export const monthlySummaryQuerySchema = z.object({
  userId: nonEmpty("userId"),
  version: versionEnum,
});

/** 必須の 3 つが指定されていること */
export const arenaHistoryRequiredSchema = z.object({
  userId: nonEmpty("userId"),
  version: nonEmpty("version"),
  start: nonEmpty("start"),
  end: nonEmpty("end"),
});

export const arenaHistoryValueSchema = z.object({
  userId: z.string(),
  version: versionEnum,
  startDate: z.string().transform((s) => new Date(s)).refine((d) => !isNaN(d.getTime()), "start must be a valid date"),
  endDate: z.string().transform((s) => new Date(s)).refine((d) => !isNaN(d.getTime()), "end must be a valid date"),
});
