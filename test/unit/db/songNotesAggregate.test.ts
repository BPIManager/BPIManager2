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

const { songNotesAggregateRepo } = await import("@/lib/db/aggregates/songNotes");

describe("songNotesAggregateRepo.getNotes", () => {
  it("行データをSongNoteRow形式に変換すること(数値化・真偽値化)", async () => {
    dbHolder.current = createDbSpy([
      {
        id: 1,
        userId: "user-1",
        body: "メモ本文",
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-02"),
        authorTotalBpi: "35.5",
        upvoteCount: "3",
        upvoted: 1,
        editable: 0,
      },
    ]);

    const result = await songNotesAggregateRepo.getNotes(1, "viewer-1", "latest");

    expect(result).toEqual([
      {
        id: 1,
        body: "メモ本文",
        authorTotalBpi: 35.5,
        upvoteCount: 3,
        upvoted: true,
        editable: false,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-02"),
      },
    ]);
  });

  it("authorTotalBpiがnullの場合nullを維持すること", async () => {
    dbHolder.current = createDbSpy([
      {
        id: 1,
        userId: "user-1",
        body: "本文",
        createdAt: new Date(),
        updatedAt: new Date(),
        authorTotalBpi: null,
        upvoteCount: "0",
        upvoted: 0,
        editable: 0,
      },
    ]);
    const [note] = await songNotesAggregateRepo.getNotes(1, "viewer-1", "latest");
    expect(note.authorTotalBpi).toBeNull();
  });

  it("sort='bpi'の場合、bpiベースのorderByが使われること", async () => {
    dbHolder.current = createDbSpy([]);
    await songNotesAggregateRepo.getNotes(1, "viewer-1", "bpi");
    const orderByCalls = callsFor(dbHolder.current.calls, "orderBy");
    expect(orderByCalls[0].args[1]).toBe("desc");
  });
});

describe("songNotesAggregateRepo.getRecentNotes", () => {
  it("行データをRecentNoteRow形式に変換すること", async () => {
    dbHolder.current = createDbSpy([
      {
        id: 1,
        songId: 10,
        songTitle: "冥",
        difficulty: "ANOTHER",
        difficultyLevel: 12,
        body: "本文",
        createdAt: new Date("2025-01-01"),
        authorTotalBpi: "20",
        upvoteCount: "7",
      },
    ]);

    const [note] = await songNotesAggregateRepo.getRecentNotes("upvotes", 10, 0);

    expect(note.authorTotalBpi).toBe(20);
    expect(note.upvoteCount).toBe(7);
  });

  it("limit/offsetが適用されること", async () => {
    dbHolder.current = createDbSpy([]);
    await songNotesAggregateRepo.getRecentNotes("latest", 5, 15);
    expect(callsFor(dbHolder.current.calls, "limit")[0].args).toEqual([5]);
    expect(callsFor(dbHolder.current.calls, "offset")[0].args).toEqual([15]);
  });
});
