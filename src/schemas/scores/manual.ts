import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { z } from "zod";

export const scoresManualBodySchema = z.object({
  songId: z.coerce.number().int().positive(),
  version: z.enum(IIDX_VERSIONS),
  exScore: z.coerce.number().int().min(0),
});

export type ScoresManualBodyInput = z.output<typeof scoresManualBodySchema>;
