import type { VersionTitle } from "@/types/iidx/version";

export const versionTitles: VersionTitle[] = [
  { num: "26", title: "26 Rootage", disabled: true },
  { num: "27", title: "27 HEROIC VERSE", disabled: true },
  { num: "28", title: "28 BISTROVER", disabled: true },
  { num: "29", title: "29 CastHour", disabled: true },
  { num: "30", title: "30 RESIDENT", disabled: true },
  { num: "31", title: "31 EPOLIS", disabled: true },
  { num: "32", title: "32 Pinky Crush", disabled: true },
  { num: "33", title: "33 Sparkle Shower", default: true },
  { num: "INF", title: "INFINITAS", disabled: true },
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

export const verNameArr: string[] = [
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
  "26 Rootage",
  "27 HEROIC VERSE",
  "28 BISTROVER",
  "29 CastHour",
  "30 RESIDENT",
  "31 EPOLIS",
  "32 Pinky Crush",
  "33 Sparkle Shower",
];
