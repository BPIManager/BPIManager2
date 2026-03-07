import Papa from "papaparse";
import { IIDX_DIFFICULTIES } from "@/constants/diffs";

export const parseCSV = (csvData: string) => {
  const parsed = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error("CSVの形式が正しくありません。");
  }

  return parsed.data.flatMap((row: any) => {
    const title = row["タイトル"];
    const lastPlayed = row["最終プレー日時"];
    if (!title) return [];

    return IIDX_DIFFICULTIES.map((diff) => {
      const level = parseInt(row[`${diff} 難易度`] || "0");
      const clearState = row[`${diff} クリアタイプ`];

      if ((level === 11 || level === 12) && clearState !== "NO PLAY") {
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
        };
      }
      return null;
    }).filter(Boolean);
  });
};
