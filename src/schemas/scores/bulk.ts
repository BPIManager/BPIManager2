import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { z } from "zod";

const csvRowSchema = z.object({
  title: z.string().min(1).max(255),
  difficulty: z.string().min(1).max(32),
  exScore: z.number().int().min(0),
  clearState: z.string().min(1).max(32),
  missCount: z.number().int().min(0).nullable(),
  lastPlayed: z.string().max(64).nullable(),
});

export const scoresBulkBodySchema = z.object({
  version: z.enum(IIDX_VERSIONS),
  csvRows: z.array(csvRowSchema).max(10000),
});

export type ScoresBulkBodyInput = z.output<typeof scoresBulkBodySchema>;
