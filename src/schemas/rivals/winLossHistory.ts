import { z } from "zod";
import { iidxVersionSchema } from "@/schemas/common/version";

export const winLossHistoryQuerySchema = z.object({
  userId: z.string().min(1),
  rivalId: z.string().min(1),
  version: iidxVersionSchema,
  level: z.coerce
    .number()
    .int()
    .refine((v) => v === 11 || v === 12),
});
