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
  "INF",
] as const;

export const latestVersion: IIDXVersion = "33";
