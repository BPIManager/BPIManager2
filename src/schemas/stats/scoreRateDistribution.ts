import { z } from "zod";
import { VALID_STEPS, type ValidStep } from "@/schemas/stats/singleBPIDistribution";

export const scoreRateDistributionParamsSchema = z.object({
  step: z
    .coerce.number()
    .refine(
      (v): v is ValidStep => (VALID_STEPS as readonly number[]).includes(v),
    )
    .catch(10)
    .default(10),
});
