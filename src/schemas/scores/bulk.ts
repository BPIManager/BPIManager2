import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { z } from "zod";

const csvRowSchema = z.object({
  title: z.string().min(1),
  difficulty: z.string().min(1),
  exScore: z.number(),
  clearState: z.string().min(1),
  missCount: z.number().nullable(),
  lastPlayed: z.string().nullable(),
});

export const scoresBulkBodySchema = z.object({
  version: z.enum(IIDX_VERSIONS),
  csvRows: z.array(csvRowSchema).max(10000),
});

export type ScoresBulkBodyInput = z.output<typeof scoresBulkBodySchema>;
