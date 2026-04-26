import { z } from "zod";

export const neighborRecommendedParamsSchema = z.object({
  limit: z.coerce.number().int().default(20),
  offset: z.coerce.number().int().default(0),
  n: z.coerce.number().int().min(1).max(200).default(20),
});
