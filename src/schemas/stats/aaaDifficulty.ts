import { iidxVersionQuerySchema } from "@/schemas/common/version";
import { z } from "zod";

export const aaaDifficultySchema = z.object({
  userId: z.string().min(1),
  version: iidxVersionQuerySchema,
  level: z.coerce.number().int(),
  customGoalRatio: z.coerce.number().min(0).max(1).optional(),
  customGoalOffset: z.coerce.number().int().optional(),
});
