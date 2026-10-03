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
 * 現行最新バージョンのリリース日（YYYY-MM-DD）。最新バージョンへ投入するCSVの最終プレー日時がこれより前のみの場合、旧バージョンCSVの誤投入として警告する基準にする。
 */
export const latestVersionReleaseDate = "2026-09-16";

/**
 * アリーナ関連データの参照先バージョン。公式サイトのデータが latestVersion にまだ追いついていないため、直近で実データが揃うバージョンを指定する。
 * latestVersion が追いついたら値を更新する。
 */
export const arenaDataVersion: IIDXVersion = "33";
