import { z } from "zod";
import { IIDX_DIFFICULTIES } from "@/constants/diffs";

const toArray = (v: unknown) => (Array.isArray(v) ? v : v != null ? [v] : []);

export const timelineQuerySchema = z.object({
  lastId: z.string().optional(),
  mode: z.enum(["all", "played", "overtaken"]).default("all"),
  search: z.string().optional(),
  levels: z.preprocess(toArray, z.array(z.coerce.number())).optional(),
  difficulties: z
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
    .optional(),
});

export type TimelineQueryOutput = z.output<typeof timelineQuerySchema>;
