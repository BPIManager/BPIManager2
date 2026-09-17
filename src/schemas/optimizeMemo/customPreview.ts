import { z } from "zod";

export const customGoalPreviewBodySchema = z.object({
  targets: z
    .array(
      z.object({
        songId: z.number(),
        toExScore: z.number().min(0),
      }),
    )
    .min(1)
    .max(50),
});

export type CustomGoalPreviewBodyInput = z.output<
  typeof customGoalPreviewBodySchema
>;
