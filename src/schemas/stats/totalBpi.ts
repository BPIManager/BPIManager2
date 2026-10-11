import { asOfSchema } from "@/schemas/common/asOf";
import { iidxVersionQuerySchema } from "@/schemas/common/version";
import { z } from "zod";

export const totalBpiSchema = z.object({
  userId: z.string().min(1),
  version: iidxVersionQuerySchema,
  asOf: asOfSchema.optional(),
});
