import Papa from "papaparse";
import { IIDX_DIFFICULTIES } from "@/constants/diffs";
import { detectCsvType } from "./detect";
import { parseRefluxTsv } from "./adapters/reflux";
import { parseRizaltoCsv } from "./adapters/result_techo";
import type { ParsedCsvRow } from "./types";

export type { ParsedCsvRow };

/** 公式CSVのパース用関数 */
export const parseCSV = (csvData: string): ParsedCsvRow[] => {
  const parsed = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error("CSVの形式が正しくありません。");
  }

  return (parsed.data as Record<string, string>[]).flatMap((row) => {
    const title = row["タイトル"];
    const lastPlayed = row["最終プレー日時"];
    if (!title) return [];

    return IIDX_DIFFICULTIES.map((diff) => {
      const clearState = row[`${diff} クリアタイプ`];

      if (clearState !== "NO PLAY") {
        const missStr = row[`${diff} ミスカウント`];
        const missCount =
          missStr === "---" || !missStr ? null : parseInt(missStr);

        return {
          title,
          difficulty: diff,
          exScore: parseInt(row[`${diff} スコア`] || "0"),
          clearState,
          missCount,
          lastPlayed: lastPlayed || null,
        } satisfies ParsedCsvRow;
      }
      return null;
    }).filter(Boolean) as ParsedCsvRow[];
  });
};

/**
 * CSV/TSV 種別を自動判別し、適切なパーサーで変換して標準行配列を返す。
 * 公式CSV・Reflux TSV・リザルト手帳 CSV に対応。
 */
export const parseAnyCsv = (rawData: string): ParsedCsvRow[] => {
  const type = detectCsvType(rawData);

  switch (type) {
    case "official":
      return parseCSV(rawData);
    case "reflux":
      return parseRefluxTsv(rawData);
    case "result_techo":
      return parseRizaltoCsv(rawData);
    default:
      throw new Error(
        "未対応のフォーマットです。公式CSV・Reflux TSV・リザルト手帳 CSV を貼り付けてください。",
      );
  }
};
