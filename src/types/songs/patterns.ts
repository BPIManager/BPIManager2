import type { VoteType } from "@/types/db";

export interface SongPatternItem {
  pattern: string;
  score: number;
  upvoteCount: number;
  downvoteCount: number;
  myVote: VoteType | null;
}

export interface PatternsPage {
  items: SongPatternItem[];
  nextCursor: number | null;
}
