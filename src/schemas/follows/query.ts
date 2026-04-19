import { z } from "zod";

export const followsQuerySchema = z.object({
  type: z.enum(["following", "followers"]),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type FollowsQuery = z.output<typeof followsQuerySchema>;
