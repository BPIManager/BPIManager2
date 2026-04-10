import { db } from "@/lib/db";
import { sql } from "kysely";

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

class SongNotesRepository {
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
  
  async createNote(
    songId: number,
    userId: string,
    body: string,
  ): Promise<number> {
    const result = await db
      .insertInto("songNotes")
      .values({ songId, userId, body })
      .executeTakeFirstOrThrow();
    return Number(result.insertId);
  }

  async updateNote(
    noteId: number,
    userId: string,
    body: string,
  ): Promise<boolean> {
    const result = await db
      .updateTable("songNotes")
      .set({ body })
      .where("id", "=", noteId)
      .where("userId", "=", userId)
      .executeTakeFirst();
    return (result.numUpdatedRows ?? 0n) > 0n;
  }

  async deleteNote(noteId: number, userId: string): Promise<boolean> {
    const result = await db
      .deleteFrom("songNotes")
      .where("id", "=", noteId)
      .where("userId", "=", userId)
      .executeTakeFirst();
    return (result.numDeletedRows ?? 0n) > 0n;
  }

  async addUpvote(noteId: number, userId: string): Promise<number> {
    await db
      .insertInto("songNoteUpvotes")
      .values({ noteId, userId })
      .ignore()
      .execute();
    return this.countUpvotes(noteId);
  }

  async removeUpvote(noteId: number, userId: string): Promise<number> {
    await db
      .deleteFrom("songNoteUpvotes")
      .where("noteId", "=", noteId)
      .where("userId", "=", userId)
      .execute();
    return this.countUpvotes(noteId);
  }

  async noteExists(noteId: number): Promise<boolean> {
    const row = await db
      .selectFrom("songNotes")
      .select("id")
      .where("id", "=", noteId)
      .executeTakeFirst();
    return row !== undefined;
  }

  private async countUpvotes(noteId: number): Promise<number> {
    const row = await db
      .selectFrom("songNoteUpvotes")
      .select((eb) => eb.fn.countAll<number>().as("cnt"))
      .where("noteId", "=", noteId)
      .executeTakeFirstOrThrow();
    return Number(row.cnt);
  }
}

export const songNotesRepo = new SongNotesRepository();
