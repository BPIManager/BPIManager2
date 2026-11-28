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
  /** 使用オプション（RANDOM など）。BPIM2 Camera の読み取り。省略・null 可 */
  useOption: z.string().trim().min(1).max(32).nullish(),
  /** ミスカウント。省略・null なら、同じバージョンの最新の記録の値を引き継ぐ */
  missCount: z.coerce.number().int().min(0).nullish(),
});

export type ScoresManualBodyInput = z.output<typeof scoresManualBodySchema>;
