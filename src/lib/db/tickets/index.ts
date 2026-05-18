import { db } from "@/lib/db";
import { sql } from "kysely";
import type { TicketSongResult } from "@/types/tickets";
import type { VoteType } from "@/types/db";

const PAGE_SIZE = 10;

class TicketsRepository {
  async getLatestTotalBpi(userId: string, version: string): Promise<number | null> {
    const row = await db
      .selectFrom("userStatusLogs")
      .select("totalBpi")
      .where("userId", "=", userId)
      .where("version", "=", version)
      .orderBy("id", "desc")
      .limit(1)
      .executeTakeFirst();
    return row ? Number(row.totalBpi) : null;
  }

  async getTopSongsForTicket(
    pattern: string,
    userId: string,
    version: string,
    totalBpi: number | null,
    offset: number = 0,
    scoreMode: "relative" | "raw" = "relative",
  ): Promise<{ items: TicketSongResult[]; hasMore: boolean }> {
    const latestScores = db
      .selectFrom("scores")
      .select([
        "songId",
        "exScore",
        "bpi",
        "clearState",
        sql<number>`row_number() over(partition by songId order by logId desc)`.as("rn"),
      ])
      .where("userId", "=", userId)
      .where("version", "=", version);

    const rows = await db
      .selectFrom("songPatterns as sp")
      .innerJoin("songs as s", "s.songId", "sp.songId")
      .leftJoin("songAttributes as sa", "sa.songId", "sp.songId")
      .leftJoin(latestScores.as("sc"), (join) =>
        join.onRef("sc.songId", "=", "sp.songId").on("sc.rn", "=", 1),
      )
      .select([
        "sp.songId",
        "sp.score as patternScore",
        "s.title",
        "s.difficulty",
        "s.difficultyLevel",
        "s.notes",
        "s.bpm",
        "s.textage",
        "sc.exScore",
        "sc.bpi",
        "sc.clearState",
        "sa.g_scratch",
        "sa.g_soflan",
        "sa.g_cn",
        "sa.g_chord",
        "sa.g_intensity",
        "sa.g_delay",
        "sa.g_tateren",
        "sa.g_trill_denim",
        "sa.g_peak",
      ])
      .select(() => [
        sql<number>`(SELECT MAX(score) FROM songPatterns WHERE songId = sp.songId)`.as("maxPatternScore"),
        sql<number>`(SELECT COUNT(*) FROM songPatternVotes WHERE songId = sp.songId AND pattern = sp.pattern AND voteType = 'upvote')`.as("upvoteCount"),
        sql<number>`(SELECT COUNT(*) FROM songPatternVotes WHERE songId = sp.songId AND pattern = sp.pattern AND voteType = 'downvote')`.as("downvoteCount"),
        sql<VoteType | null>`(SELECT voteType FROM songPatternVotes WHERE songId = sp.songId AND pattern = sp.pattern AND userId = ${userId} LIMIT 1)`.as("myVote"),
      ])
      .where("sp.pattern", "=", pattern)
      .orderBy(
        scoreMode === "raw"
          ? sql`sp.score`
          : sql`CASE WHEN (SELECT MAX(score) FROM songPatterns WHERE songId = sp.songId) > 0
                  THEN sp.score / (SELECT MAX(score) FROM songPatterns WHERE songId = sp.songId)
                  ELSE -9999 END`,
        "desc",
      )
      .limit(PAGE_SIZE + 1)
      .offset(offset)
      .execute();

    const hasMore = rows.length > PAGE_SIZE;
    const items = (hasMore ? rows.slice(0, PAGE_SIZE) : rows).map((r) => ({
      songId: r.songId,
      title: r.title,
      difficulty: r.difficulty,
      difficultyLevel: r.difficultyLevel,
      notes: r.notes,
      bpm: r.bpm,
      textage: r.textage ?? null,
      patternScore: Number(r.patternScore),
      maxPatternScore: Number(r.maxPatternScore),
      relativeScore: Number(r.maxPatternScore) > 0
        ? (Number(r.patternScore) / Number(r.maxPatternScore)) * 100
        : 0,
      exScore: r.exScore ?? null,
      bpi: r.bpi != null ? Number(r.bpi) : null,
      clearState: r.clearState ?? null,
      bpiGap: totalBpi != null && r.bpi != null ? totalBpi - Number(r.bpi) : null,
      upvoteCount: Number(r.upvoteCount),
      downvoteCount: Number(r.downvoteCount),
      myVote: r.myVote ?? null,
      g_scratch: r.g_scratch != null ? Number(r.g_scratch) : null,
      g_soflan: r.g_soflan != null ? Number(r.g_soflan) : null,
      g_cn: r.g_cn != null ? Number(r.g_cn) : null,
      g_chord: r.g_chord != null ? Number(r.g_chord) : null,
      g_intensity: r.g_intensity != null ? Number(r.g_intensity) : null,
      g_delay: r.g_delay != null ? Number(r.g_delay) : null,
      g_tateren: r.g_tateren != null ? Number(r.g_tateren) : null,
      g_trill_denim: r.g_trill_denim != null ? Number(r.g_trill_denim) : null,
      g_peak: r.g_peak != null ? Number(r.g_peak) : null,
    }));

    return { items, hasMore };
  }
}

export const ticketsRepo = new TicketsRepository();
