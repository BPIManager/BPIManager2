import { latestVersion, IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { z } from "zod";

export const aaaDifficultySchema = z.object({
  userId: z.string().min(1),
  version: z
    .string()
    .refine((v): v is (typeof IIDX_VERSIONS)[number] =>
      (IIDX_VERSIONS as readonly string[]).includes(v),
    )
    .catch(latestVersion)
    .default(latestVersion),
  level: z.coerce.number().int(),
  customGoalRatio: z.coerce.number().min(0).max(1).optional(),
  customGoalOffset: z.coerce.number().int().optional(),
});
