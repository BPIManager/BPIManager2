import { z } from "zod";
import {
  NATIONWIDE_AREA_ID,
  TOP_RANKER_AREA_NAMES,
  TOP_RANKER_VERSIONS,
} from "@/constants/iidx/topRankerAreas";
import { ALL_DIFFICULTIES } from "@/constants/iidx/songLevels";

/** トップランカー系のクエリパラメータの検証スキーマ（検証とエラー応答の原因提示は、ここの定義から出す） */

const topRankerVersion = z.enum(TOP_RANKER_VERSIONS, {
  error: `version must be one of ${TOP_RANKER_VERSIONS.join(", ")}`,
});

/** 0 以上、エリア数未満の整数（文字列） */
const areaIdString = z
  .string()
  .regex(/^\d+$/, "areaId must be a non-negative integer")
  .transform(Number)
  .refine((n) => n < TOP_RANKER_AREA_NAMES.length, "areaId is out of range");

/** カンマ区切りの文字列を配列にする（未指定・空は空配列） */
const csv = z.preprocess(
  (v) => (typeof v === "string" && v !== "" ? v.split(",") : []),
  z.array(z.string()),
);

export const topRankersListQuerySchema = z.object({
  version: topRankerVersion,
});

export const topRankersAreaScoresQuerySchema = z.object({
  version: topRankerVersion,
  areaId: areaIdString,
});

export const topRankersRankingQuerySchema = z.object({
  version: topRankerVersion,
  area: areaIdString.default(NATIONWIDE_AREA_ID),
  levels: csv.pipe(
    z.array(
      z
        .string()
        .regex(/^\d+$/, "levels must be integers")
        .transform(Number)
        .refine((n) => n >= 1 && n <= 12, "levels must be between 1 and 12"),
    ),
  ),
  difficulties: csv.pipe(
    z.array(z.enum(ALL_DIFFICULTIES as [string, ...string[]], { error: "difficulties contains an unknown value" })),
  ),
});
