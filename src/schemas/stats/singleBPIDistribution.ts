import { z } from "zod";

export const VALID_STEPS = [1, 2, 5, 10] as const;
export type ValidStep = (typeof VALID_STEPS)[number];

export const singleBPIDistributionParamsSchema = z.object({
  step: z
    .coerce.number()
    .refine(
      (v): v is ValidStep => (VALID_STEPS as readonly number[]).includes(v),
    )
    .catch(10)
    .default(10),
});
