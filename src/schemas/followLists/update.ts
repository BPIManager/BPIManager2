import { z } from "zod";

export const updateFollowListBodySchema = z
  .object({
    name: z.string().trim().min(1, "name is required").max(50).optional(),
    isPublic: z.boolean().optional(),
  })
  .refine((v) => v.name !== undefined || v.isPublic !== undefined, {
    message: "name or isPublic is required",
  });

export type UpdateFollowListBodyInput = z.output<
  typeof updateFollowListBodySchema
>;
