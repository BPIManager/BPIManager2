import { z } from "zod";

export const songContributionBodySchema = z.object({
  targets: z
    .array(
      z.object({
        songId: z.number(),
        /** そのメモが保存された時点でのEXスコア（未プレイなら null） */
        baselineExScore: z.number().nullable(),
      }),
    )
    .min(1)
    .max(50),
});

export type SongContributionBodyInput = z.output<
  typeof songContributionBodySchema
>;
