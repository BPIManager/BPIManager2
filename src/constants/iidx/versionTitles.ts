/** IIDXバージョンタイトル一覧とユーティリティ関数 */
import type { VersionTitle } from "@/types/iidx/version";

export const versionTitles: VersionTitle[] = [
  { num: "26", title: "26 Rootage" },
  { num: "27", title: "27 HEROIC VERSE" },
  { num: "28", title: "28 BISTROVER" },
  { num: "29", title: "29 CastHour" },
  { num: "30", title: "30 RESIDENT" },
  { num: "31", title: "31 EPOLIS" },
  { num: "32", title: "32 Pinky Crush" },
  { num: "33", title: "33 Sparkle Shower", default: true },
  { num: "34", title: "34 ZINRAI", disabled: true },
  { num: "INF", title: "INFINITAS" },
];

export const getVersionNameFromNumber = (v: number | string): string => {
  const version = versionTitles.find((item) => item.num === String(v));
  return version ? version.title : "Unknown Version";
};

export const versionsOptions = versionTitles.map((v) => ({
  label: v.title,
  value: v.num,
  disabled: v.disabled,
}));

export const activeVersionsOptions = versionTitles
  .filter((v) => !v.disabled)
  .map((v) => ({
    label: v.title,
    value: v.num,
  }));

export const versionsNonDisabledCollection = versionTitles.map((v) => ({
  label: v.title,
  value: v.num,
}));

// versionTitlesに定義の無い過去バージョン（3rd style〜25 CANNON BALLERS）の
// タイトルは他に管理元が無いため、配列インデックス=バージョン番号のまま
// ここに直接保持する。26以降はversionTitlesを正としてそこから導出する。
const HISTORICAL_VERSION_TITLES: readonly string[] = [
  "",
  "",
  "",
  "3rd style",
  "4th style",
  "5th style",
  "6th style",
  "7th style",
  "8th style",
  "9th style",
  "10th style",
  "11 RED",
  "12 HAPPY SKY",
  "13 DistorteD",
  "14 GOLD",
  "15 DJ TROOPERS",
  "16 EMPRESS",
  "17 SIRIUS",
  "18 Resort Anthem",
  "19 Lincle",
  "20 Tricoro",
  "21 SPADA",
  "22 PENDUAL",
  "23 copula",
  "24 SINOBUZ",
  "25 CANNON BALLERS",
];

export const verNameArr: string[] = [...HISTORICAL_VERSION_TITLES];
for (const v of versionTitles) {
  if (v.num === "INF") continue;
  verNameArr[Number(v.num)] = v.title;
}
