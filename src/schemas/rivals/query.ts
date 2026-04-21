import { IIDX_VERSIONS } from "@/constants/latestVersion";
import { z } from "zod";
import { scoresQuerySchema } from "@/schemas/scores/query";

export const rivalScoresQuerySchema = scoresQuerySchema.extend({
  userId: z.string().min(1),
  rivalId: z.string().min(1),
  version: z.enum(IIDX_VERSIONS),
});

export type RivalScoresQueryOutput = z.output<typeof rivalScoresQuerySchema>;
