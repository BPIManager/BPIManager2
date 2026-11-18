/**
 * INFINITAS 公式CSV（全曲・全難易度の横持ち形式）を標準インポート行へ変換する。
 * 行末のカンマ有無で列数が揃わないため、列数不一致エラーは許容する。
 */

import Papa from "papaparse";
import { ALL_DIFFICULTIES } from "@/constants/iidx/songLevels";
import { correctInfinitasTitle } from "../correct-title";
import type { ParsedCsvRow } from "../types";

const normalizeDate = (raw: string | undefined): string | null => {
  const v = raw?.trim();
  return !v || v === "---" ? null : v;
};

export const parseInfinitasCsv = (csvData: string): ParsedCsvRow[] => {
  const parsed = Papa.parse<Record<string, string>>(csvData, {
    header: true,
    skipEmptyLines: true,
  });

  const fatal = parsed.errors.filter((e) => e.type !== "FieldMismatch");
  if (fatal.length > 0) {
    throw new Error("INFINITAS CSV の形式が正しくありません。");
  }

  return parsed.data.flatMap((row) => {
    const rawTitle = row["タイトル"]?.trim();
    const title = rawTitle && correctInfinitasTitle(rawTitle);
    if (!title) return [];

    return ALL_DIFFICULTIES.flatMap((diff): ParsedCsvRow[] => {
      const clearState = row[`${diff} クリアタイプ`]?.trim();
      if (!clearState || clearState === "NO PLAY") return [];

      const exScore = parseInt(row[`${diff} スコア`] ?? "", 10);
      if (!exScore || exScore <= 0) return [];

      const missRaw = parseInt(row[`${diff} ミスカウント`] ?? "", 10);

      return [
        {
          title,
          difficulty: diff,
          exScore,
          clearState,
          missCount: isNaN(missRaw) ? null : missRaw,
          lastPlayed:
            normalizeDate(row[`${diff} 最終スコア更新時刻`]) ??
            normalizeDate(row[`${diff} 最終プレー日時`]),
        },
      ];
    });
  });
};
