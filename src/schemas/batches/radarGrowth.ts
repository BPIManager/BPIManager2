import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { ALL_RADAR_CATEGORIES } from "@/constants/iidx/radars";
import { z } from "zod";
import type { RadarCategory } from "@/types/stats/radar";

export const batchRadarGrowthQuerySchema = z.object({
  userId: z.string().min(1),
  batchId: z.string().min(1),
  version: z.enum(IIDX_VERSIONS),
  type: z.enum(["batch", "day", "week", "month"]).default("batch"),
  groupedBy: z.enum(["lastPlayed", "createdAt"]).default("createdAt"),
});

export const batchRadarGrowthSongsQuerySchema = batchRadarGrowthQuerySchema.extend({
  category: z.enum(ALL_RADAR_CATEGORIES as [RadarCategory, ...RadarCategory[]]),
});
