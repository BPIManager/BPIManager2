import { allScoresListRepo } from "@/lib/db/aggregates/allScores/list";
import { allScoresSelfRivalRepo } from "@/lib/db/aggregates/allScores/selfAndRivals";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import type { HandlerResult } from "@/types/api";

/**
 * all-scores（全難易度スコア）ドメインの subhandler 共通型。
 * v1/v2 のルートから共有する。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

export type AllScoresList = Awaited<
  ReturnType<typeof allScoresListRepo.getAllScoresList>
>;
export type ScoreHistory = Awaited<
  ReturnType<typeof allScoresRepo.getScoreHistory>
>;
export type AllSongRanking = Awaited<
  ReturnType<typeof allScoresSelfRivalRepo.getAllSongRanking>
>;

export interface AllSongRivalsBody {
  songId: number;
  version: string;
  rivals: {
    userId: string;
    userName: string;
    profileImage: string | null;
    exScore: number | null;
    bpi: number | null;
    clearState: string | null;
    lastPlayed: Date | null;
  }[];
}
