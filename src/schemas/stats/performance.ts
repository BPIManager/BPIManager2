import { iidxVersionQuerySchema } from "@/schemas/common/version";
import { z } from "zod";

export const performanceSchema = z.object({
  userId: z.string().min(1),
  version: iidxVersionQuerySchema,
  date: z.iso.date(),
});
