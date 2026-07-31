import { db } from "@/lib/db";
import { sql } from "kysely";

export interface RecentNoteRow {
  id: number;
  songId: number;
  songTitle: string;
  difficulty: string;
  difficultyLevel: number;
  body: string;
  authorTotalBpi: number | null;
  upvoteCount: number;
  createdAt: Date;
}

export interface SongNoteRow {
  id: number;
  body: string;
  authorTotalBpi: number | null;
  upvoteCount: number;
  upvoted: boolean;
  editable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * `songNotes`（投稿ノート）に、投稿者の表示用情報（`userStatusLogs`の
 * 最新totalBpi）や楽曲情報（`songs`）を結合した複合ビューを組み立てる。
 *
 * `songNotes`ドメイン本来の責務（ノートの読み書き）を超えたクロスドメイン
 * 参照のため、`domains/songNotes`ではなくここに置く（#173）。
 */
class SongNotesAggregateRepository {
  async getNotes(
    songId: number,
    viewerId: string,
    sort: "latest" | "bpi",
  ): Promise<SongNoteRow[]> {
    let query = db
      .selectFrom("songNotes as sn")
      .select([
        "sn.id",
        "sn.userId",
        "sn.body",
        "sn.createdAt",
        "sn.updatedAt",
      ])
      .select((eb) => [
        eb
          .selectFrom("userStatusLogs as usl")
          .select("usl.totalBpi")
          .whereRef("usl.userId", "=", "sn.userId")
          .orderBy("usl.id", "desc")
          .limit(1)
          .as("authorTotalBpi"),
        sql<number>`(SELECT COUNT(*) FROM songNoteUpvotes WHERE noteId = sn.id)`.as(
          "upvoteCount",
        ),
        sql<0 | 1>`EXISTS(SELECT 1 FROM songNoteUpvotes WHERE noteId = sn.id AND userId = ${viewerId})`.as(
          "upvoted",
        ),
        sql<0 | 1>`(sn.userId = ${viewerId} AND ${viewerId} != '')`.as(
          "editable",
        ),
      ])
      .where("sn.songId", "=", songId);

    if (sort === "bpi") {
      query = query.orderBy(
        sql`COALESCE((SELECT totalBpi FROM userStatusLogs WHERE userId = sn.userId ORDER BY id DESC LIMIT 1), -999)`,
        "desc",
      );
    } else {
      query = query.orderBy("sn.createdAt", "desc");
    }

    const rows = await query.execute();

    return rows.map((r) => ({
      id: r.id,
      body: r.body,
      authorTotalBpi:
        r.authorTotalBpi !== null ? Number(r.authorTotalBpi) : null,
      upvoteCount: Number(r.upvoteCount),
      upvoted: Boolean(r.upvoted),
      editable: Boolean(r.editable),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async getRecentNotes(
    sort: "upvotes" | "latest",
    limit = 20,
    offset = 0,
  ): Promise<RecentNoteRow[]> {
    let query = db
      .selectFrom("songNotes as sn")
      .innerJoin("songs as s", "s.songId", "sn.songId")
      .select([
        "sn.id",
        "sn.songId",
        "s.title as songTitle",
        "s.difficulty",
        "s.difficultyLevel",
        "sn.body",
        "sn.createdAt",
      ])
      .select((eb) => [
        eb
          .selectFrom("userStatusLogs as usl")
          .select("usl.totalBpi")
          .whereRef("usl.userId", "=", "sn.userId")
          .orderBy("usl.id", "desc")
          .limit(1)
          .as("authorTotalBpi"),
        sql<number>`(SELECT COUNT(*) FROM songNoteUpvotes WHERE noteId = sn.id)`.as(
          "upvoteCount",
        ),
      ])
      .limit(limit)
      .offset(offset);

    if (sort === "upvotes") {
      query = query.orderBy(
        sql`(SELECT COUNT(*) FROM songNoteUpvotes WHERE noteId = sn.id)`,
        "desc",
      );
    } else {
      query = query.orderBy("sn.createdAt", "desc");
    }

    const rows = await query.execute();

    return rows.map((r) => ({
      id: r.id,
      songId: r.songId,
      songTitle: r.songTitle,
      difficulty: r.difficulty,
      difficultyLevel: r.difficultyLevel,
      body: r.body,
      authorTotalBpi:
        r.authorTotalBpi !== null ? Number(r.authorTotalBpi) : null,
      upvoteCount: Number(r.upvoteCount),
      createdAt: r.createdAt,
    }));
  }
}

export const songNotesAggregateRepo = new SongNotesAggregateRepository();
