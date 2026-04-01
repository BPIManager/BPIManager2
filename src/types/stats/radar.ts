export type RadarCategory =
  | "NOTES"
  | "CHORD"
  | "PEAK"
  | "CHARGE"
  | "SCRATCH"
  | "SOFLAN";

export interface RadarSongEntry {
  title: string;
  difficulty: string;
  exScore: number | null;
  notes: number | null;
  bpi: number;
}

export interface RadarCategoryResult {
  totalBpi: number;
  songs: RadarSongEntry[];
}

export type RadarResponse = {
  [K in RadarCategory]: RadarCategoryResult;
};

export type RadarSummaryData = {
  [K in Lowercase<RadarCategory>]: number;
};
