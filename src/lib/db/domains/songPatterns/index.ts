import { db } from "@/lib/db";
import { sql } from "kysely";
import type { VoteType } from "@/types/db";

export interface SongPatternRow {
  pattern: string;
  score: number;
  upvoteCount: number;
  downvoteCount: number;
  myVote: VoteType | null;
}

export interface PatternsPage {
  items: SongPatternRow[];
  nextCursor: number | null;
}

const PAGE_SIZE = 100;

class SongPatternsRepository {
  async getPatterns(
    songId: number,
    cursor: number,
    viewerId: string,
    sortBy: "score" | "upvote" = "score",
  ): Promise<PatternsPage> {
    const rows = await db
      .selectFrom("songPatterns as sp")
      .select(["sp.pattern", "sp.score"])
      .select(() => [
        sql<number>`(SELECT COUNT(*) FROM songPatternVotes WHERE songId = sp.songId AND pattern = sp.pattern AND voteType = 'upvote')`.as(
          "upvoteCount",
        ),
        sql<number>`(SELECT COUNT(*) FROM songPatternVotes WHERE songId = sp.songId AND pattern = sp.pattern AND voteType = 'downvote')`.as(
          "downvoteCount",
        ),
        sql<VoteType | null>`(SELECT voteType FROM songPatternVotes WHERE songId = sp.songId AND pattern = sp.pattern AND userId = ${viewerId} LIMIT 1)`.as(
          "myVote",
        ),
      ])
      .where("sp.songId", "=", songId)
      .orderBy(
        sortBy === "upvote"
          ? sql`(SELECT COUNT(*) FROM songPatternVotes WHERE songId = sp.songId AND pattern = sp.pattern AND voteType = 'upvote')`
          : sql`sp.score`,
        "desc",
      )
      .limit(PAGE_SIZE + 1)
      .offset(cursor)
      .execute();

    const hasMore = rows.length > PAGE_SIZE;
    const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    return {
      items: items.map((r) => ({
        pattern: r.pattern,
        score: Number(r.score),
        upvoteCount: Number(r.upvoteCount),
        downvoteCount: Number(r.downvoteCount),
        myVote: r.myVote ?? null,
      })),
      nextCursor: hasMore ? cursor + PAGE_SIZE : null,
    };
  }

  async vote(
    songId: number,
    pattern: string,
    userId: string,
    voteType: VoteType,
  ): Promise<void> {
    await db
      .insertInto("songPatternVotes")
      .values({ songId, pattern, userId, voteType })
      .onDuplicateKeyUpdate({ voteType })
      .execute();
  }

  async deleteVote(
    songId: number,
    pattern: string,
    userId: string,
  ): Promise<void> {
    await db
      .deleteFrom("songPatternVotes")
      .where("songId", "=", songId)
      .where("pattern", "=", pattern)
      .where("userId", "=", userId)
      .execute();
  }

  async searchPattern(
    songId: number,
    pattern: string,
  ): Promise<{ score: number; rank: number; total: number } | null> {
    const row = await db
      .selectFrom("songPatterns as sp")
      .select(() => [
        sql<number>`sp.score`.as("score"),
        sql<number>`(SELECT COUNT(*) FROM songPatterns WHERE songId = ${songId} AND score > sp.score) + 1`.as("rank"),
        sql<number>`(SELECT COUNT(*) FROM songPatterns WHERE songId = ${songId})`.as("total"),
      ])
      .where("sp.songId", "=", songId)
      .where("sp.pattern", "=", pattern)
      .executeTakeFirst();

    if (!row) return null;
    return {
      score: Number(row.score),
      rank: Number(row.rank),
      total: Number(row.total),
    };
  }
}

export const songPatternsRepo = new SongPatternsRepository();
