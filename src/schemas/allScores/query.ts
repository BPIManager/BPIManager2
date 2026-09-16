import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { z } from "zod";

export const allScoresSelfVersionQuerySchema = z.object({
  userId: z.string().min(1),
  targetVersion: z.enum(IIDX_VERSIONS),
});
