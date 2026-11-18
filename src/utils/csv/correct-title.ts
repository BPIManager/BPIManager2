import corrections from "./title-corrections.json";
import infinitasCorrections from "./infinitas-title-corrections.json";

const correctionMap = new Map<string, string>(
  Object.entries(corrections as Record<string, string>),
);

/**
 * Reflux 等の楽曲名表記を DB 側の正式表記に変換する。title-corrections.json に無ければそのまま返す。
 * 新しい表記揺れは title-corrections.json に { "外部表記": "DB正式表記" } を1行追加する。
 */
export const correctTitle = (title: string): string =>
  correctionMap.get(title) ?? title;

const infinitasCorrectionMap = new Map<string, string>(
  Object.entries(infinitasCorrections as Record<string, string>),
);

/**
 * INFINITAS CSV の楽曲名を、固定の1:1対応表（完全一致のみ）で allSongs の表記に変換する。無ければそのまま返す。
 * 対応表は scripts/generateInfinitasTitleCorrections.ts で生成・確認し、あいまい照合は実行時に行わない。
 */
export const correctInfinitasTitle = (title: string): string =>
  infinitasCorrectionMap.get(title) ?? title;
