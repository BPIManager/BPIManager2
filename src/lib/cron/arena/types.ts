import type { IIDXVersion } from "@/types/iidx/version";

export interface ArenaEventEntry {
  round: number;
  start: string; // ISO 8601 UTC
  end: string; // ISO 8601 UTC
}

export interface ArenaVersionMetadata {
  version: IIDXVersion;
  events: ArenaEventEntry[]; // sorted descending by round
}
