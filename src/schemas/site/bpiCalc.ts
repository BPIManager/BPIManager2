import { z } from "zod";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { IIDX_VERSIONS, latestVersion } from "@/constants/iidx/iidxVersions";

/** BPI の計算モデル。v1=皆伝平均とWRの2アンカー、v2=分布ベース、both=両方 */
export const BPI_MODELS = ["v1", "v2", "both"] as const;

export const bpiCalcQuerySchema = z.object({
  title: z.string().min(1),
  difficulty: z.enum(IIDX_DIFFICULTIES),
  exScore: z.coerce.number().int().min(0),
  version: z
    .enum(IIDX_VERSIONS)
    .optional()
    .transform((v) => v ?? latestVersion),
  includeRank: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  model: z.enum(BPI_MODELS).optional().default("v2"),
});
