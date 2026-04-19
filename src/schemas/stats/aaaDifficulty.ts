import { latestVersion, IIDX_VERSIONS } from "@/constants/latestVersion";
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
});
