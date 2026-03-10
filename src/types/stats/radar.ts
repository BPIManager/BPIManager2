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
  exScore: number;
  bpi: number;
}

export interface RadarCategoryResult {
  totalBpi: number;
  songs: RadarSongEntry[];
}

export type RadarResponse = {
  [K in RadarCategory]: RadarCategoryResult;
};
