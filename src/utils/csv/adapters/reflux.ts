/**
 * Reflux TSV → 標準インポート行フォーマット 変換アダプタ
 *
 * ランプ値マッピング:
 *   FC  → FULLCOMBO CLEAR
 *   EXH / EX → EX HARD CLEAR
 *   HC  → HARD CLEAR
 *   NC  → CLEAR
 *   AC  → ASSIST CLEAR
 *   EC  → EASY CLEAR
 *   FAILED / F → FAILED
 *   NP / '' → スキップ (未プレイ)
 */

import type { ParsedCsvRow } from "../types";
import { correctTitle } from "../correct-title";

/** SP 各難易度のヘッダープレフィックスとDB難易度名の対応 */
const SP_DIFFICULTIES: { prefix: string; difficulty: string }[] = [
  { prefix: "SPB", difficulty: "BEGINNER" },
  { prefix: "SPN", difficulty: "NORMAL" },
  { prefix: "SPH", difficulty: "HYPER" },
  { prefix: "SPA", difficulty: "ANOTHER" },
  { prefix: "SPL", difficulty: "LEGGENDARIA" },
];

const LAMP_MAP: Record<string, string> = {
  FC: "FULLCOMBO CLEAR",
  EXH: "EX HARD CLEAR",
  EX: "EX HARD CLEAR",
  HC: "HARD CLEAR",
  NC: "CLEAR",
  CLEAR: "CLEAR",
  AC: "ASSIST CLEAR",
  EC: "EASY CLEAR",
  F: "FAILED",
};

/**
 * Reflux TSV 文字列を標準インポート行の配列に変換する。
 */
export const parseRefluxTsv = (tsvData: string): ParsedCsvRow[] => {
  const lines = tsvData.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split("\t");
  const headerIndex = new Map(headers.map((h, i) => [h.trim(), i]));

  const titleIdx = headerIndex.get("title") ?? -1;
  if (titleIdx === -1)
    throw new Error("Reflux TSV: title カラムが見つかりません");

  const rows: ParsedCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    const title = correctTitle(cols[titleIdx]?.trim() ?? "");
    if (!title) continue;

    for (const { prefix, difficulty } of SP_DIFFICULTIES) {
      const lampIdx = headerIndex.get(`${prefix} Lamp`) ?? -1;
      const exScoreIdx = headerIndex.get(`${prefix} EX Score`) ?? -1;
      const missIdx = headerIndex.get(`${prefix} Miss Count`) ?? -1;

      if (lampIdx === -1) continue;

      const rawLamp = cols[lampIdx]?.trim() ?? "";
      if (!rawLamp || rawLamp === "NP") continue;

      const clearState = LAMP_MAP[rawLamp];
      if (!clearState) continue;

      const rawEx = cols[exScoreIdx]?.trim() ?? "0";
      const exScore = parseInt(rawEx, 10);
      if (!exScore || exScore <= 0) continue;

      const rawMiss = cols[missIdx]?.trim() ?? "";
      const missCount =
        rawMiss === "-" || rawMiss === "" || rawMiss === "---"
          ? null
          : parseInt(rawMiss, 10);

      rows.push({
        title,
        difficulty,
        exScore,
        clearState,
        missCount: isNaN(missCount as number) ? null : missCount,
        lastPlayed: null,
      });
    }
  }

  return rows;
};
