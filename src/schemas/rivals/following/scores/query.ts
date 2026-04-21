import z from "zod";
import { rivalScoresQuerySchema } from "../../query";
import { IIDX_VERSIONS } from "@/constants/latestVersion";

export const rivalFollowingScoresQuerySchema = rivalScoresQuerySchema
  .omit({ rivalId: true })
  .extend({
    songId: z.coerce.number().int(),
  });

export const scoreComparisonQuerySchema = z.object({
  version: z.enum(IIDX_VERSIONS),
  limit: z.coerce.number().int().default(10),
  lastDiff: z.coerce.number().optional(),
  lastSongId: z.string().optional(),
  lastRivalId: z.string().optional(),
  levels: z
    .preprocess(
      (v) => (Array.isArray(v) ? v : v ? [v] : []),
      z.array(z.coerce.string()),
    )
    .default([]),
  difficulties: z
    .preprocess(
      (v) => (Array.isArray(v) ? v : v ? [v] : []),
      z.array(z.string()),
    )
    .default([]),
  minDiff: z.coerce.number().default(1),
  maxDiff: z.coerce.number().default(30),
});
