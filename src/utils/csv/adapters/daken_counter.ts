/**
 * 打鍵カウンタ CSV → 標準インポート行フォーマット 変換アダプタ (INFINITAS専用)
 *
 * ヘッダー: LV,Title,mode,Lamp,Score,(rate),BP,Opt(best score),Opt(min bp),Last Played
 *
 * mode → difficulty マッピング:
 *   SPA → ANOTHER
 *   SPH → HYPER
 *   SPL → LEGGENDARIA
 *   SPN → NORMAL
 *   SPB → BEGINNER
 *
 * Lamp マッピング:
 *   F-COMBO   → FULLCOMBO CLEAR
 *   EXH-CLEAR → EX HARD CLEAR
 *   H-CLEAR   → HARD CLEAR
 *   A-CLEAR   → ASSIST CLEAR
 *   E-CLEAR   → EASY CLEAR
 *   CLEAR     → CLEAR
 *   FAILED    → FAILED
 */

import Papa from "papaparse";
import type { ParsedCsvRow } from "../types";

const MODE_TO_DIFFICULTY: Record<string, string> = {
  SPA: "ANOTHER",
  SPH: "HYPER",
  SPL: "LEGGENDARIA",
  SPN: "NORMAL",
  SPB: "BEGINNER",
};

const LAMP_MAP: Record<string, string> = {
  "F-COMBO": "FULLCOMBO CLEAR",
  "EXH-CLEAR": "EX HARD CLEAR",
  "H-CLEAR": "HARD CLEAR",
  "A-CLEAR": "ASSIST CLEAR",
  "E-CLEAR": "EASY CLEAR",
  CLEAR: "CLEAR",
  FAILED: "FAILED",
};

export const parseDakenCounterCsv = (csvData: string): ParsedCsvRow[] => {
  const parsed = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error("打鍵カウンタ CSV の形式が正しくありません。");
  }

  const rows: ParsedCsvRow[] = [];

  for (const row of parsed.data as Record<string, string>[]) {
    const title = row["Title"]?.trim();
    const rawMode = row["mode"]?.trim() ?? "";
    const rawLamp = row["Lamp"]?.trim() ?? "";
    const rawScore = row["Score"]?.trim() ?? "";
    const rawBp = row["BP"]?.trim() ?? "";
    const rawDate = row["Last Played"]?.trim() ?? "";

    if (!title) continue;

    const difficulty = MODE_TO_DIFFICULTY[rawMode];
    if (!difficulty) continue;

    if (!rawLamp || rawLamp === "NO PLAY") continue;

    const clearState = LAMP_MAP[rawLamp];
    if (!clearState) continue;

    const exScore = parseInt(rawScore, 10);
    if (!exScore || exScore <= 0) continue;

    const missCount =
      rawBp === "?" || rawBp === "" || rawBp === "---"
        ? null
        : parseInt(rawBp, 10);

    // 1970-01-01 はプレイ日時未記録扱いで null にする
    const lastPlayed =
      rawDate && !rawDate.startsWith("1970-01-01") ? rawDate : null;

    rows.push({
      title,
      difficulty,
      exScore,
      clearState,
      missCount: isNaN(missCount as number) ? null : missCount,
      lastPlayed,
    });
  }

  return rows;
};
