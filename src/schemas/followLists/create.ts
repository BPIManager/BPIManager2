import { z } from "zod";

export const createFollowListBodySchema = z.object({
  name: z.string().trim().min(1, "name is required").max(50),
  isPublic: z.boolean().optional().default(false),
});

export type CreateFollowListBodyInput = z.output<
  typeof createFollowListBodySchema
>;
