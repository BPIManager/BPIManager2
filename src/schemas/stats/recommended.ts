import { z } from "zod";

export const recommendedParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().default(0),
});
