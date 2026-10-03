import corrections from "./title-corrections.json";

const correctionMap = new Map<string, string>(
  Object.entries(corrections as Record<string, string>),
);

/**
 * Reflux 等の楽曲名表記を DB 側の正式表記に変換する。title-corrections.json に無ければそのまま返す。
 * 新しい表記揺れは title-corrections.json に { "外部表記": "DB正式表記" } を1行追加する。
 */
export const correctTitle = (title: string): string =>
  correctionMap.get(title) ?? title;
