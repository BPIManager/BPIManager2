export interface TicketItem {
  ticketId: string;
  expiresAt: string;
}

export interface TicketSongResult {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  bpm: string;
  textage: string | null;
  patternScore: number;
  maxPatternScore: number;
  relativeScore: number;
  exScore: number | null;
  bpi: number | null;
  clearState: string | null;
  bpiGap: number | null;
  upvoteCount: number;
  downvoteCount: number;
  myVote: "upvote" | "downvote" | null;
  g_scratch: number | null;
  g_soflan: number | null;
  g_cn: number | null;
  g_chord: number | null;
  g_intensity: number | null;
  g_delay: number | null;
  g_tateren: number | null;
  g_trill_denim: number | null;
  g_peak: number | null;
}

export interface TicketRecommendResult {
  ticketId: string;
  expiresAt: string;
  items: TicketSongResult[];
  hasMore: boolean;
  totalBpi: number | null;
}

export type TicketSortKey = "patternScore" | "bpiGap" | "bpi";
export type ScoreMode = "relative" | "raw";
