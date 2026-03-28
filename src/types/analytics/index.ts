export type AnalyticsTargetKind =
  | "rival"
  | "rival-avg"
  | "rival-top"
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
  label: string;
}
