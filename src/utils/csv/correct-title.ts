import corrections from "./title-corrections.json";

const correctionMap = new Map<string, string>(
  Object.entries(corrections as Record<string, string>),
);

/**
 * Reflux など外部ツールの楽曲名表記をDB側の正式表記に変換する。
 * title-corrections.json にエントリがあればそれを返し、なければそのまま返す。
 *
 * 新しい表記揺れを発見した場合は title-corrections.json に
 * { "外部ツール表記": "DB正式表記" } の形式で1行追加するだけでよい。
 */
export const correctTitle = (title: string): string =>
  correctionMap.get(title) ?? title;
