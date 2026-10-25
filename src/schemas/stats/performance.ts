import { iidxVersionQuerySchema } from "@/schemas/common/version";
import { z } from "zod";

export const performanceSchema = z.object({
  userId: z.string().min(1),
  version: iidxVersionQuerySchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
