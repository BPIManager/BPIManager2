/**
 * インポートCSV/TSVの種別を自動検出するユーティリティ
 */

export type CsvType =
  | "official" // 公式CSV
  | "reflux" // Reflux TSV
  | "result_techo" // リザルト手帳 CSV
  | "daken_counter" // 打鍵カウンタ CSV
  | "infinitas_csv" // INFINITAS 公式CSV
  | "unknown";

const REFLUX_HEADER_MARKER = "title\tType\tLabel\t";
const RESULT_TECHO_HEADER_MARKER_1 = "バージョン";
const RESULT_TECHO_HEADER_MARKER_2 = "曲名";
const INFINITAS_CSV_HEADER_MARKERS = [
  "BEGINNER 最終スコア更新時刻", // 日本語版
  "BEGINNER 최종 스코어 갱신 일시", // 韓国語版
];
const OFFICIAL_HEADER_MARKER = "タイトル";
const INFINITAS_KO_TITLE_MARKER = "타이틀";
const DAKEN_COUNTER_HEADER_MARKER = "LV,Title,mode,";

/**
 * テキストの1行目を見てCSV種別を返す。
 */
export const detectCsvType = (text: string): CsvType => {
  const firstLine = text.trimStart().split(/\r?\n/)[0] ?? "";

  if (firstLine.startsWith(REFLUX_HEADER_MARKER)) return "reflux";

  if (firstLine.startsWith(DAKEN_COUNTER_HEADER_MARKER)) return "daken_counter";

  if (
    firstLine.includes(RESULT_TECHO_HEADER_MARKER_1) &&
    firstLine.includes(RESULT_TECHO_HEADER_MARKER_2)
  )
    return "result_techo";

  // 公式CSVと同じ「タイトル」列を持つため、公式CSVより先に判定する
  if (
    INFINITAS_CSV_HEADER_MARKERS.some((m) => firstLine.includes(m)) &&
    (firstLine.includes(OFFICIAL_HEADER_MARKER) ||
      firstLine.includes(INFINITAS_KO_TITLE_MARKER))
  )
    return "infinitas_csv";

  if (firstLine.includes(OFFICIAL_HEADER_MARKER)) return "official";

  return "unknown";
};

export const CSV_TYPE_LABELS: Record<CsvType, string> = {
  official: "アーケード公式CSV",
  reflux: "Reflux TSV",
  result_techo: "リザルト手帳 CSV",
  daken_counter: "打鍵カウンタ CSV",
  infinitas_csv: "INFINITAS CSV",
  unknown: "不明",
};

const INFINITAS_VERSION = "INF";

/** INFINITASバージョン向け: INFINITAS CSV / Reflux TSV / リザルト手帳 / 打鍵カウンタのみ受け付ける */
const INF_ALLOWED: CsvType[] = [
  "infinitas_csv",
  "reflux",
  "result_techo",
  "daken_counter",
];
/** 通常バージョン向け: 公式CSVのみ受け付ける */
const NORMAL_ALLOWED: CsvType[] = ["official"];

/**
 * 選択中バージョンと CSV 種別の組み合わせを検証する。問題があればエラーメッセージ、無ければ null を返す（type が unknown なら null）。
 */
export const validateCsvTypeForVersion = (
  type: CsvType,
  version: string,
): string | null => {
  if (type === "unknown") return null;

  const isInf = version === INFINITAS_VERSION;

  if (isInf && !INF_ALLOWED.includes(type)) {
    return "INFINITASバージョンにはアーケードの公式CSVは使用できません。INFINITAS CSV・Reflux TSV・リザルト手帳CSV・打鍵カウンタCSVを貼り付けてください。";
  }
  if (!isInf && !NORMAL_ALLOWED.includes(type)) {
    return "このバージョンには INFINITAS CSV / Reflux TSV / リザルト手帳CSV / 打鍵カウンタCSVは使用できません。公式CSVを貼り付けてください。";
  }
  return null;
};
