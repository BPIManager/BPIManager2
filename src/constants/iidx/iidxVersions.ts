/** IIDXバージョン一覧と最新バージョン定数 */
import type { IIDXVersion } from "@/types/iidx/version";

export const IIDX_VERSIONS = [
  "26",
  "27",
  "28",
  "29",
  "30",
  "31",
  "32",
  "33",
  "34",
  "INF",
] as const;

export const latestVersion: IIDXVersion = "34";

/**
 * 現行最新バージョンのリリース日（YYYY-MM-DD）。
 * CSVインポート時、最終プレー日時がこの日より前の行のみで構成されるCSVを
 * 最新バージョン(`latestVersion`)へ投入しようとした場合に、旧バージョンCSVの
 * 誤投入である可能性を警告する基準日として使う。
 */
export const latestVersionReleaseDate = "2026-09-16";
