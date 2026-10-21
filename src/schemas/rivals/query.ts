import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { z } from "zod";
import { scoresQuerySchema } from "@/schemas/scores/query";

export const rivalScoresQuerySchema = scoresQuerySchema.extend({
  userId: z.string().min(1),
  rivalId: z.string().min(1),
  version: z.enum(IIDX_VERSIONS),
  /** ライバル側だけ別バージョンのスコアと比較する場合に指定（未指定は version と同じ） */
  rivalVersion: z.enum(IIDX_VERSIONS).optional(),
});

export type RivalScoresQueryOutput = z.output<typeof rivalScoresQuerySchema>;
