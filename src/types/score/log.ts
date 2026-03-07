import { Score } from "../sql";

export type SongHistoryResponse = {
  [version: string]: Score[];
};
