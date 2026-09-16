import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { z } from "zod";

export const allScoresSelfVersionQuerySchema = z
  .object({
    userId: z.string().min(1),
    currentVersion: z.enum(IIDX_VERSIONS),
    targetVersion: z.enum(IIDX_VERSIONS),
  })
  .refine((data) => data.currentVersion !== data.targetVersion, {
    message: "currentVersion and targetVersion must differ.",
    path: ["targetVersion"],
  });
