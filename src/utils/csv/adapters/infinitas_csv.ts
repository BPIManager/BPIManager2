/**
 * INFINITAS 公式CSV（全曲・全難易度の横持ち形式）を標準インポート行へ変換する。
 * 行末のカンマ有無で列数が揃わないため、列数不一致エラーは許容する。
 */

import Papa from "papaparse";
import { ALL_DIFFICULTIES } from "@/constants/iidx/songLevels";
import { correctInfinitasTitle } from "../correct-title";
import type { ParsedCsvRow } from "../types";

/** 言語ごとの列見出し（日本語版・韓国語版の公式CSVで難易度名以外が異なる） */
const COLUMN_LABELS = {
  ja: {
    title: "タイトル",
    score: "スコア",
    miss: "ミスカウント",
    clear: "クリアタイプ",
    updated: "最終スコア更新時刻",
    played: "最終プレー日時",
  },
  ko: {
    title: "타이틀",
    score: "스코어",
    miss: "미스 카운트",
    clear: "클리어 타입",
    updated: "최종 스코어 갱신 일시",
    played: "최종 플레이 일자",
  },
} as const;

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

  const labels = parsed.meta.fields?.includes(COLUMN_LABELS.ko.title)
    ? COLUMN_LABELS.ko
    : COLUMN_LABELS.ja;

  return parsed.data.flatMap((row) => {
    const rawTitle = row[labels.title]?.trim();
    const title = rawTitle && correctInfinitasTitle(rawTitle);
    if (!title) return [];

    return ALL_DIFFICULTIES.flatMap((diff): ParsedCsvRow[] => {
      const clearState = row[`${diff} ${labels.clear}`]?.trim();
      if (!clearState || clearState === "NO PLAY") return [];

      const exScore = parseInt(row[`${diff} ${labels.score}`] ?? "", 10);
      if (!exScore || exScore <= 0) return [];

      const missRaw = parseInt(row[`${diff} ${labels.miss}`] ?? "", 10);

      return [
        {
          title,
          difficulty: diff,
          exScore,
          clearState,
          missCount: isNaN(missRaw) ? null : missRaw,
          lastPlayed:
            normalizeDate(row[`${diff} ${labels.updated}`]) ??
            normalizeDate(row[`${diff} ${labels.played}`]),
        },
      ];
    });
  });
};
