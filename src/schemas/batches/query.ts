import { latestVersion, IIDX_VERSIONS } from "@/constants/latestVersion";
import { z } from "zod";

const batchPathSchema = z.object({
  userId: z.string().min(1),
  batchId: z.string().min(1),
});

export const batchDetailGetQuerySchema = batchPathSchema.extend({
  version: z.enum(IIDX_VERSIONS),
});

export const batchDetailDeleteQuerySchema = batchPathSchema;

export type BatchDetailGetQueryOutput = z.output<typeof batchDetailGetQuerySchema>;
export type BatchDetailDeleteQueryOutput = z.output<typeof batchDetailDeleteQuerySchema>;

export const batchScoresQuerySchema = batchPathSchema.extend({
  version: z.enum(IIDX_VERSIONS),
  type: z.enum(["day", "week", "month"]).default("day"),
  groupedBy: z.enum(["lastPlayed", "createdAt"]).default("createdAt"),
});

export type BatchScoresQueryOutput = z.output<typeof batchScoresQuerySchema>;


export const batchesQuerySchema = z.object({
  userId: z.string().min(1),
  version: z
    .string()
    .refine((v): v is (typeof IIDX_VERSIONS)[number] =>
      (IIDX_VERSIONS as readonly string[]).includes(v),
    )
    .catch(latestVersion)
    .default(latestVersion),
  groupedBy: z.enum(["lastPlayed", "batch", "createdAt"]).default("batch"),
  topN: z.coerce.number().int().positive().default(5),
});

export type BatchesQueryOutput = z.output<typeof batchesQuerySchema>;
