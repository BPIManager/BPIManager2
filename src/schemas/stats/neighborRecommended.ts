import { z } from "zod";

export const neighborRecommendedParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  n: z.coerce.number().int().min(1).max(200).default(20),
});
