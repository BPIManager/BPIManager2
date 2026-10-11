import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { CLEAR_STATES } from "@/constants/iidx/clearLamps";
import { ALL_DIFFICULTIES } from "@/constants/iidx/songLevels";
import { z } from "zod";

const csvRowSchema = z.object({
  title: z.string().min(1).max(255),
  difficulty: z.enum(ALL_DIFFICULTIES as [string, ...string[]]),
  exScore: z.number().int().min(0),
  // 未知の値はランプ順位付けできないまま保存されるため、定義済みのクリア状態に限る
  clearState: z.enum(
    CLEAR_STATES.map((s) => s.value) as [string, ...string[]],
  ),
  missCount: z.number().int().min(0).nullable(),
  lastPlayed: z.string().max(64).nullable(),
});

export const scoresBulkBodySchema = z.object({
  version: z.enum(IIDX_VERSIONS),
  csvRows: z.array(csvRowSchema).max(10000),
});

export type ScoresBulkBodyInput = z.output<typeof scoresBulkBodySchema>;
