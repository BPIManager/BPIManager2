import { z } from "zod";
import { iidxVersionSchema } from "@/schemas/common/version";

const towerRowSchema = z.object({
  playDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  keyCount: z.number().int().nonnegative(),
  scratchCount: z.number().int().nonnegative(),
});

export const iidxTowerPostBodySchema = z.object({
  version: iidxVersionSchema,
  rows: z.array(towerRowSchema).min(1).max(1000),
});
