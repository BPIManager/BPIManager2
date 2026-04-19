import { latestVersion, IIDX_VERSIONS } from "@/constants/latestVersion";
import { z } from "zod";

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
