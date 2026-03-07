export const IIDX_VERSIONS = [
  "26",
  "27",
  "28",
  "29",
  "30",
  "31",
  "32",
  "33",
] as const;

export type IIDXVersion = (typeof IIDX_VERSIONS)[number];

export const latestVersion: IIDXVersion = "33";
