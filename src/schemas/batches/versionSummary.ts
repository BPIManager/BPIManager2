import { z } from "zod";
import { iidxVersionSchema } from "@/schemas/common/version";

export const versionSummaryQuerySchema = z.object({
  userId: z.string().min(1),
  version: iidxVersionSchema,
});
