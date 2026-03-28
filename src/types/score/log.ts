import { Score } from "../sql";
import { RivalScore } from "../songs/withScore";

export type SongHistoryResponse = {
  [version: string]: Score[];
};

export type { RivalScore };
