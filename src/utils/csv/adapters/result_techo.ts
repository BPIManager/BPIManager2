/**
 * リザルト手帳 CSV → 標準インポート行フォーマット 変換アダプタ。
 *
 * クリアタイプマッピング (リザルト手帳 → DB値):
 *   EXH-CLEAR → EX HARD CLEAR
 *   F-COMBO   → FULLCOMBO CLEAR
 *   H-CLEAR   → HARD CLEAR
 *   A-CLEAR   → ASSIST CLEAR
 *   E-CLEAR   → EASY CLEAR
 *   CLEAR     → CLEAR
 *   FAILED    → FAILED
 *   NO PLAY   → スキップ
 *
 * 日付フォーマット: YYYYMMDD-HHmmss → YYYY-MM-DD HH:mm:ss
 */

import Papa from "papaparse";
import type { ParsedCsvRow } from "../types";

const CLEAR_TYPE_MAP: Record<string, string> = {
  "EXH-CLEAR": "EX HARD CLEAR",
  "F-COMBO": "FULLCOMBO CLEAR",
  "H-CLEAR": "HARD CLEAR",
  "A-CLEAR": "ASSIST CLEAR",
  "E-CLEAR": "EASY CLEAR",
  CLEAR: "CLEAR",
  FAILED: "FAILED",
};

/**
 * `20250809-211322` 形式の日付文字列を `2025-08-09 21:13:22` に変換する。
 * 無効な文字列は null を返す。
 */
const parseRizaltoDate = (raw: string): string | null => {
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
};

/**
 * リザルト手帳 CSV 文字列を標準インポート行の配列に変換する。
 */
export const parseRizaltoCsv = (csvData: string): ParsedCsvRow[] => {
  const parsed = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error("リザルト手帳 CSV の形式が正しくありません。");
  }

  const rows: ParsedCsvRow[] = [];

  for (const row of parsed.data as Record<string, string>[]) {
    const title = row["曲名"]?.trim();
    const difficulty = row["難易度"]?.trim();
    const rawClearType = row["クリアタイプ"]?.trim() ?? "";
    const rawScore = row["スコア"]?.trim() ?? "";
    const rawMiss = row["ミスカウント"]?.trim() ?? "";
    const rawDate = row["最終プレイ日時"]?.trim() ?? "";

    if (!title || !difficulty) continue;
    if (!rawClearType || rawClearType === "NO PLAY") continue;

    const clearState = CLEAR_TYPE_MAP[rawClearType];
    if (!clearState) continue;

    const exScore = parseInt(rawScore, 10);
    if (!exScore || exScore <= 0) continue;

    const missCount =
      rawMiss === "---" || rawMiss === "" ? null : parseInt(rawMiss, 10);

    rows.push({
      title,
      difficulty,
      exScore,
      clearState,
      missCount: isNaN(missCount as number) ? null : missCount,
      lastPlayed: parseRizaltoDate(rawDate),
    });
  }

  return rows;
};
