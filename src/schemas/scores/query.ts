import { latestVersion, IIDX_VERSIONS } from "@/constants/latestVersion";
import { z } from "zod";

export const scoresQuerySchema = z.object({
  version: z
    .string()
    .refine(
      (v): v is (typeof IIDX_VERSIONS)[number] =>
        (IIDX_VERSIONS as readonly string[]).includes(v),
      { message: "Missing or invalid version parameter." },
    )
    .catch(latestVersion)
    .default(latestVersion),
  asOf: z.string().optional(),
  clearState: z.string().optional(),
  bpiMin: z.coerce.number().optional(),
  bpiMax: z.coerce.number().optional(),
  bpmMin: z.coerce.number().optional(),
  bpmMax: z.coerce.number().optional(),
  notesMin: z.coerce.number().optional(),
  notesMax: z.coerce.number().optional(),
  isSofran: z
    .union([z.literal("true"), z.literal("1")])
    .transform(() => true)
    .optional(),
  search: z.string().optional(),
  sortKey: z
    .enum([
      "title",
      "level",
      "bpi",
      "exScore",
      "notes",
      "bpm",
      "updatedAt",
      "version",
      "rivalBpi",
      "myBpi",
      "rivalRate",
      "myRate",
      "scoreRate",
      "winGapAsc",
      "winGapDesc",
      "loseGapAsc",
      "loseGapDesc",
      "winBpiGapAsc",
      "winBpiGapDesc",
      "loseBpiGapAsc",
      "loseBpiGapDesc",
      "rivalUpdated",
      "myUpdated",
    ])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type ScoresQueryOutput = z.output<typeof scoresQuerySchema>;

export const songHistoryQuerySchema = z.object({
  userId: z.string().min(1),
  songId: z.coerce.number().int().positive(),
});

export type SongHistoryQueryOutput = z.output<typeof songHistoryQuerySchema>;

export const selfVersionComparisonQuerySchema = z
  .object({
    userId: z.string().min(1),
    currentVersion: z.enum(IIDX_VERSIONS),
    targetVersion: z.enum(IIDX_VERSIONS),
  })
  .refine((data) => data.currentVersion !== data.targetVersion, {
    message: "currentVersion and targetVersion must differ.",
    path: ["targetVersion"],
  });
