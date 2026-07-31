import { describe, it, expect, vi } from "vitest";
import { createDbSpy, callsFor } from "../helpers/dbQuerySpy";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: { current: null as ReturnType<typeof import("../helpers/dbQuerySpy")["createDbSpy"]> | null },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return dbHolder.current!.db;
  },
}));

const { songNotesRepo } = await import("@/lib/db/domains/songNotes");

describe("songNotesRepo.createNote", () => {
  it("insertIdを数値で返すこと", async () => {
    dbHolder.current = createDbSpy({ insertId: 42n });
    const result = await songNotesRepo.createNote(1, "user-1", "本文");
    expect(result).toBe(42);
  });
});

describe("songNotesRepo.updateNote / deleteNote", () => {
  it("updateNoteは更新件数が1件以上ならtrueを返すこと", async () => {
    dbHolder.current = createDbSpy({ numUpdatedRows: 1n });
    const result = await songNotesRepo.updateNote(1, "user-1", "更新後");
    expect(result).toBe(true);
  });

  it("updateNoteは更新件数が0件ならfalseを返すこと", async () => {
    dbHolder.current = createDbSpy({ numUpdatedRows: 0n });
    const result = await songNotesRepo.updateNote(1, "user-1", "更新後");
    expect(result).toBe(false);
  });

  it("deleteNoteは削除件数が1件以上ならtrueを返すこと", async () => {
    dbHolder.current = createDbSpy({ numDeletedRows: 1n });
    const result = await songNotesRepo.deleteNote(1, "user-1");
    expect(result).toBe(true);
  });
});

describe("songNotesRepo.addUpvote / removeUpvote", () => {
  it("addUpvoteは追加後の合計upvote数を返すこと", async () => {
    dbHolder.current = createDbSpy({ cnt: 5 });
    const result = await songNotesRepo.addUpvote(1, "user-1");
    expect(result).toBe(5);
    expect(callsFor(dbHolder.current.calls, "ignore")).toHaveLength(1);
  });

  it("removeUpvoteは削除後の合計upvote数を返すこと", async () => {
    dbHolder.current = createDbSpy({ cnt: 2 });
    const result = await songNotesRepo.removeUpvote(1, "user-1");
    expect(result).toBe(2);
  });
});

describe("songNotesRepo.noteExists", () => {
  it("レコードが存在すればtrueを返すこと", async () => {
    dbHolder.current = createDbSpy({ id: 1 });
    expect(await songNotesRepo.noteExists(1)).toBe(true);
  });

  it("レコードが存在しなければfalseを返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    expect(await songNotesRepo.noteExists(1)).toBe(false);
  });
});
