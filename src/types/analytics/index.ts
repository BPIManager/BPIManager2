export type AnalyticsTargetKind =
  | "rival"
  | "rival-avg"
  | "rival-top"
  | "top-ranker"
  | "arena"
  | "aaa"
  | "max-"
  | "wr"
  | "self-version"
  | "self-best"
  | "self-best-excl";

export interface AnalyticsTarget {
  kind: AnalyticsTargetKind;
  param?: string;
  /** 比較先のIIDXバージョン。未指定なら画面で選択中のバージョン（アリーナは既定の集計バージョン） */
  version?: string;
  label: string;
}
