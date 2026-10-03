import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { z } from "zod";

/**
 * songId がどちらの楽曲ドメイン由来かを示す。bpi は songs/songDef（☆11/12）、allSongs は allSongs（全難易度）。
 * 同じ楽曲でも両ドメインで songId が異なるため、クライアントが songId 空間を明示する。
 */
export const scoresManualBodySchema = z.object({
  songId: z.coerce.number().int().positive(),
  songDomain: z.enum(["bpi", "allSongs"]),
  version: z.enum(IIDX_VERSIONS),
  exScore: z.coerce.number().int().min(0),
});

export type ScoresManualBodyInput = z.output<typeof scoresManualBodySchema>;
