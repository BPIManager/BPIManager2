import { iidxVersionQuerySchema } from "@/schemas/common/version";
import { z } from "zod";

export const activeDatesSchema = z.object({
  userId: z.string().min(1),
  version: iidxVersionQuerySchema,
});
