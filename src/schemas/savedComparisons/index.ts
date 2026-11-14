import { z } from "zod";
import { MAX_ANALYTICS_TARGETS } from "@/constants/logic/analyticsComparison";
import type { AnalyticsTargetKind } from "@/types/analytics";

const TARGET_KINDS = [
  "rival",
  "rival-avg",
  "rival-top",
  "top-ranker",
  "arena",
  "aaa",
  "max-",
  "wr",
  "self-version",
  "self-best",
  "self-best-excl",
] as const satisfies readonly AnalyticsTargetKind[];

export const analyticsTargetSchema = z.object({
  kind: z.enum(TARGET_KINDS),
  param: z.string().max(128).optional(),
  version: z.string().max(8).optional(),
  label: z.string().trim().min(1).max(100),
});

const nameSchema = z.string().trim().min(1, "name is required").max(50);
const targetsSchema = z.array(analyticsTargetSchema).min(1).max(MAX_ANALYTICS_TARGETS);

export const createSavedComparisonBodySchema = z.object({
  name: nameSchema,
  targets: targetsSchema,
});

export const updateSavedComparisonBodySchema = z
  .object({
    name: nameSchema.optional(),
    targets: targetsSchema.optional(),
  })
  .refine((v) => v.name !== undefined || v.targets !== undefined, {
    message: "name or targets is required",
  });

/** ダッシュボードのランキングタブ設定。`key` は組み込みタブ名または `saved:<id>` */
export const rankingTabsBodySchema = z.object({
  tabs: z
    .array(
      z.object({
        key: z.string().regex(/^(weapons|potential|nearLose|saved:\d+)$/),
        visible: z.boolean(),
        targetIndex: z.number().int().min(0).max(MAX_ANALYTICS_TARGETS - 1).optional(),
      }),
    )
    .max(200)
    .refine((tabs) => new Set(tabs.map((t) => t.key)).size === tabs.length, {
      message: "duplicate tab key",
    }),
});

export type RankingTabsBodyInput = z.output<typeof rankingTabsBodySchema>;
