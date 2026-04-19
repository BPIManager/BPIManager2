import { IIDX_VERSIONS } from "@/constants/latestVersion";
import { z } from "zod";

export const activeDatesSchema = z.object({
  userId: z.string().min(1),
  version: z
    .string()
    .min(1)
    .refine(
      (v): v is (typeof IIDX_VERSIONS)[number] =>
        (IIDX_VERSIONS as readonly string[]).includes(v),
      { message: "Invalid version" },
    ),
});
