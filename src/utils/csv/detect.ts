/**
 * インポートCSV/TSVの種別を自動検出するユーティリティ
 */

export type CsvType =
  | "official" // 公式CSV
  | "reflux" // Reflux TSV
  | "result_techo" // リザルト手帳 CSV
  | "unknown";

const REFLUX_HEADER_MARKER = "title\tType\tLabel\t";
const RIZALTO_HEADER_MARKER_1 = "バージョン";
const RIZALTO_HEADER_MARKER_2 = "曲名";
const OFFICIAL_HEADER_MARKER = "タイトル";

/**
 * テキストの1行目を見てCSV種別を返す。
 */
export const detectCsvType = (text: string): CsvType => {
  const firstLine = text.trimStart().split(/\r?\n/)[0] ?? "";

  if (firstLine.startsWith(REFLUX_HEADER_MARKER)) return "reflux";

  if (
    firstLine.includes(RIZALTO_HEADER_MARKER_1) &&
    firstLine.includes(RIZALTO_HEADER_MARKER_2)
  )
    return "result_techo";

  if (firstLine.includes(OFFICIAL_HEADER_MARKER)) return "official";

  return "unknown";
};

export const CSV_TYPE_LABELS: Record<CsvType, string> = {
  official: "公式CSV",
  reflux: "Reflux TSV",
  result_techo: "リザルト手帳 CSV",
  unknown: "不明",
};

const INFINITAS_VERSION = "INF";

/** INFINITASバージョン向け: Reflux TSV / リザルト手帳のみ受け付ける */
const INF_ALLOWED: CsvType[] = ["reflux", "result_techo"];
/** 通常バージョン向け: 公式CSVのみ受け付ける */
const NORMAL_ALLOWED: CsvType[] = ["official"];

/**
 * 選択中バージョンとCSV種別の組み合わせが有効かを検証する。
 * 問題がある場合はエラーメッセージ文字列を、問題なければ null を返す。
 * `type === "unknown"` の場合は入力なしとみなし null を返す。
 */
export const validateCsvTypeForVersion = (
  type: CsvType,
  version: string,
): string | null => {
  if (type === "unknown") return null;

  const isInf = version === INFINITAS_VERSION;

  if (isInf && !INF_ALLOWED.includes(type)) {
    return "INFINITASバージョンには公式CSVは使用できません。Reflux TSV またはリザルト手帳CSVを貼り付けてください。";
  }
  if (!isInf && !NORMAL_ALLOWED.includes(type)) {
    return "このバージョンには Reflux TSV / リザルト手帳CSVは使用できません。公式CSVを貼り付けてください。";
  }
  return null;
};
