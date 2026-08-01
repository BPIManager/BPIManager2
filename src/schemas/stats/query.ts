import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { iidxVersionQuerySchema } from "@/schemas/common/version";
import { parseArray } from "@/utils/common/parseArray";
import { z } from "zod";

export const statsQuerySchema = z.object({
  userId: z.string().default(""),
  version: iidxVersionQuerySchema,
  level: z.preprocess(parseArray, z.array(z.coerce.number())).default([]),
  difficulty: z
    .preprocess(
      parseArray,
      z.array(
        z
          .string()
          .refine((v): v is (typeof IIDX_DIFFICULTIES)[number] =>
            (IIDX_DIFFICULTIES as readonly string[]).includes(v),
          ),
      ),
    )
    .catch([])
    .default([]),
});

export type StatsQueryInput = z.input<typeof statsQuerySchema>;
export type StatsQueryOutput = z.output<typeof statsQuerySchema>;
