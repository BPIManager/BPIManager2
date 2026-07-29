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

const { songPatternsRepo } = await import("@/lib/db/songPatterns");

const makeRow = (i: number) => ({
  pattern: `pattern-${i}`,
  score: i,
  upvoteCount: "1",
  downvoteCount: "0",
  myVote: null,
});

describe("songPatternsRepo.getPatterns", () => {
  it("101件返ってきた場合、100件に切り詰めてnextCursorを設定すること", async () => {
    const rows = Array.from({ length: 101 }, (_, i) => makeRow(i));
    dbHolder.current = createDbSpy(rows);

    const result = await songPatternsRepo.getPatterns(1, 0, "viewer-1");

    expect(result.items).toHaveLength(100);
    expect(result.nextCursor).toBe(100);
  });

  it("100件以下の場合、nextCursorはnullになること", async () => {
    const rows = Array.from({ length: 50 }, (_, i) => makeRow(i));
    dbHolder.current = createDbSpy(rows);

    const result = await songPatternsRepo.getPatterns(1, 0, "viewer-1");

    expect(result.items).toHaveLength(50);
    expect(result.nextCursor).toBeNull();
  });

  it("行データを数値化しmyVoteのnull合体を行うこと", async () => {
    dbHolder.current = createDbSpy([
      {
        pattern: "1234567",
        score: "10",
        upvoteCount: "3",
        downvoteCount: "1",
        myVote: "upvote",
      },
    ]);
    const result = await songPatternsRepo.getPatterns(1, 0, "viewer-1");
    expect(result.items[0]).toEqual({
      pattern: "1234567",
      score: 10,
      upvoteCount: 3,
      downvoteCount: 1,
      myVote: "upvote",
    });
  });

  it("cursorがoffsetとして適用されること", async () => {
    dbHolder.current = createDbSpy([]);
    await songPatternsRepo.getPatterns(1, 50, "viewer-1");
    expect(callsFor(dbHolder.current.calls, "offset")[0].args).toEqual([50]);
    expect(callsFor(dbHolder.current.calls, "limit")[0].args).toEqual([101]);
  });
});

describe("songPatternsRepo.vote / deleteVote", () => {
  it("voteは重複時voteTypeを更新するupsertを実行すること", async () => {
    dbHolder.current = createDbSpy(undefined);
    await songPatternsRepo.vote(1, "1234567", "user-1", "upvote");
    expect(
      callsFor(dbHolder.current.calls, "onDuplicateKeyUpdate")[0].args,
    ).toEqual([{ voteType: "upvote" }]);
  });

  it("deleteVoteはsongId/pattern/userIdで削除すること", async () => {
    dbHolder.current = createDbSpy(undefined);
    await songPatternsRepo.deleteVote(1, "1234567", "user-1");
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls).toHaveLength(3);
  });
});

describe("songPatternsRepo.searchPattern", () => {
  it("結果を数値化して返すこと", async () => {
    dbHolder.current = createDbSpy({ score: "10", rank: "3", total: "20" });
    const result = await songPatternsRepo.searchPattern(1, "1234567");
    expect(result).toEqual({ score: 10, rank: 3, total: 20 });
  });

  it("該当パターンがない場合nullを返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await songPatternsRepo.searchPattern(1, "1234567");
    expect(result).toBeNull();
  });
});
