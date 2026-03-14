import { Score } from "../sql";

export type SongHistoryResponse = {
  [version: string]: Score[];
};

export interface RivalScore {
  userId?: string | null;
  userName?: string | null;
  exScore: number | null;
  bpi: number | null;
  clearState: string | null;
  missCount: number | null;
  lastPlayed: Date | string | null;
}
