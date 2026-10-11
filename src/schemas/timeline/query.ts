import { z } from "zod";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { iidxVersionQuerySchema } from "@/schemas/common/version";
import { parseArray } from "@/utils/common/parseArray";

export const timelineQuerySchema = z.object({
  lastId: z.string().optional(),
  mode: z.enum(["all", "played", "overtaken"]).default("all"),
  // 未指定・不正値は最新バージョンへフォールバック
  version: iidxVersionQuerySchema,
  search: z.string().max(100).optional(),
  listId: z.coerce.number().optional(),
  levels: z
    .preprocess(
      parseArray,
      z.array(z.coerce.number().int().min(1).max(12)).max(12),
    )
    .optional(),
  difficulties: z
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
    .optional(),
});

export type TimelineQueryOutput = z.output<typeof timelineQuerySchema>;
