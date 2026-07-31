import { db } from "@/lib/db";

/**
 * `songNotes`/`songNoteUpvotes`テーブル自体の読み書きを担当するリポジトリクラス。
 *
 * 投稿者の表示用情報（`userStatusLogs`）や楽曲情報（`songs`）と結合した
 * 複合ビューは `aggregates/songNotes/` に切り出している。
 */
class SongNotesRepository {
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
