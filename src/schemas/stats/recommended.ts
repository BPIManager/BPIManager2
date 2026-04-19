import { z } from "zod";

export const recommendedParamsSchema = z.object({
  limit: z.coerce.number().int().default(10),
  offset: z.coerce.number().int().default(0),
});
