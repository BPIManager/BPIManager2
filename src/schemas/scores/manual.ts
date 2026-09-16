import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { z } from "zod";

/**
 * `songId` がどちらの楽曲ドメイン由来かを示す。
 * - `bpi`: `songs`/`songDef`ドメイン（BPI計算対象、☆11/12）
 * - `allSongs`: `allSongs`ドメイン（全難易度、☆1-12）
 *
 * 同じ楽曲・難易度でも両ドメインで`songId`の値が異なるため、どちらの
 * `songId`空間かをクライアント側で明示する。
 */
export const scoresManualBodySchema = z.object({
  songId: z.coerce.number().int().positive(),
  songDomain: z.enum(["bpi", "allSongs"]),
  version: z.enum(IIDX_VERSIONS),
  exScore: z.coerce.number().int().min(0),
});

export type ScoresManualBodyInput = z.output<typeof scoresManualBodySchema>;
