import { z } from "zod";

/** 使用オプションの選択肢（BPIM2 Camera の読み取りと同じ） */
export const USE_OPTION_CHOICES = ["OFF", "RANDOM", "R-RANDOM", "S-RANDOM", "H-RANDOM", "MIRROR"] as const;

/**
 * 記録の使用オプションを更新する（履歴タブ）。songDomain は、logId がどちらの表（bpi: scores、allSongs: allScores）のものか。
 * useOption が null なら未設定に戻す
 */
export const scoresUseOptionBodySchema = z.object({
  logId: z.coerce.number().int().positive(),
  songDomain: z.enum(["bpi", "allSongs"]),
  useOption: z.string().trim().min(1).max(32).nullable(),
});

export type ScoresUseOptionBodyInput = z.output<typeof scoresUseOptionBodySchema>;
