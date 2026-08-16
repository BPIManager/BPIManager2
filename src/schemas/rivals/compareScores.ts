import { z } from "zod";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { parseArray } from "@/utils/common/parseArray";

export const compareScoresQuerySchema = z.object({
  rivalIds: z.preprocess(parseArray, z.array(z.string().min(1))).default([]),
  version: z.enum(IIDX_VERSIONS),
});

export type CompareScoresQueryOutput = z.output<typeof compareScoresQuerySchema>;
