import { latestVersion, IIDX_VERSIONS } from "@/constants/latestVersion";
import { IIDX_DIFFICULTIES } from "@/constants/diffs";
import { z } from "zod";

const toArray = (v: unknown) => (Array.isArray(v) ? v : v != null ? [v] : []);

export const statsQuerySchema = z.object({
  userId: z.string().default(""),
  version: z
    .string()
    .refine((v): v is (typeof IIDX_VERSIONS)[number] =>
      (IIDX_VERSIONS as readonly string[]).includes(v),
    )
    .catch(latestVersion)
    .default(latestVersion),
  level: z.preprocess(toArray, z.array(z.coerce.number())).default([]),
  difficulty: z
    .preprocess(
      toArray,
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
