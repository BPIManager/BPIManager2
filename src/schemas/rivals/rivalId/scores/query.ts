import z from "zod";
import { rivalScoresQuerySchema } from "../../query";

export const rivalScoreDetailQuerySchema = rivalScoresQuerySchema.extend({
  songId: z.coerce.number().int(),
});
