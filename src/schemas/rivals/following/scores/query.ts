import { iidxVersionSchema } from "@/schemas/common/version";
import z from "zod";
import { rivalScoresQuerySchema } from "../../query";
import { parseArray } from "@/utils/common/parseArray";

export const rivalFollowingScoresQuerySchema = rivalScoresQuerySchema
  .omit({ rivalId: true })
  .extend({
    songId: z.coerce.number().int(),
    /** フォロー外でも結果に含めるユーザー(ライバルページで表示中の相手・自分) */
    includeUserIds: z
      .preprocess(parseArray, z.array(z.string().min(1)).max(8))
      .default([]),
  });

export const scoreComparisonQuerySchema = z.object({
  version: iidxVersionSchema,
  limit: z.coerce.number().int().min(1).max(100).default(10),
  lastDiff: z.coerce.number().optional(),
  lastSongId: z.string().optional(),
  lastRivalId: z.string().optional(),
  levels: z
    .preprocess(parseArray, z.array(z.coerce.string()))
    .default([]),
  difficulties: z.preprocess(parseArray, z.array(z.string())).default([]),
  minDiff: z.coerce.number().default(1),
  maxDiff: z.coerce.number().default(30),
});
