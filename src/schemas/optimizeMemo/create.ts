import { z } from "zod";
import { ALL_RADAR_CATEGORIES } from "@/constants/iidx/radars";
import type { RadarCategory } from "@/types/stats/radar";

const radarCategorySchema = z.enum(
  ALL_RADAR_CATEGORIES as [RadarCategory, ...RadarCategory[]],
);

const optimizationStepSchema = z.object({
  rank: z.number(),
  songId: z.number(),
  title: z.string(),
  difficulty: z.string(),
  difficultyLevel: z.number(),
  fromBpi: z.number(),
  toBpi: z.number(),
  fromExScore: z.number().nullable(),
  toExScore: z.number(),
  exScoreGap: z.number(),
  bpiGain: z.number(),
  cumulativeTotalBpi: z.number(),
  isUnplayed: z.boolean(),
  radarCategory: radarCategorySchema.nullable(),
  isRadarStrength: z.boolean(),
});

const optimizationResultSchema = z.object({
  steps: z.array(optimizationStepSchema).max(1000),
  currentTotalBpi: z.number(),
  targetTotalBpi: z.number(),
  originalTargetTotalBpi: z.number().optional(),
  achievable: z.boolean(),
  alreadyAchieved: z.boolean(),
  totalSongCount: z.number(),
  autoAdjustmentNote: z.string().optional(),
  maxAchievableBpi: z.number().optional(),
});

export const createOptimizeMemoBodySchema = z.object({
  targetBpi: z.number(),
  reportData: optimizationResultSchema,
});

export type CreateOptimizeMemoBodyInput = z.output<
  typeof createOptimizeMemoBodySchema
>;
