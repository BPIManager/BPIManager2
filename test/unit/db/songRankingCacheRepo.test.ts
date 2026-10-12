import { describe, it, expect, vi } from "vitest";
import { createTransactionalDbSpy, callsFor } from "../helpers/dbQuerySpy";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: { current: null as unknown },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return (dbHolder.current as { db: unknown }).db;
  },
}));

const { songRankingCacheRepo } = await import(
  "@/lib/db/domains/songRankingCache"
);

const row = (userId: string, songId: number) => ({
  userId,
  version: "33",
  songId,
  rank: 1,
  totalPlayers: 10,
});

describe("songRankingCacheRepo.replaceForVersion", () => {
  it("対象バージョンの既存行を削除してから、新しい行を書き込むこと", async () => {
    const spy = createTransactionalDbSpy();
    dbHolder.current = spy;

    await songRankingCacheRepo.replaceForVersion("33", [row("u1", 1), row("u2", 1)]);

    const methods = spy.calls.map((c) => c.method);
    expect(methods.indexOf("deleteFrom")).toBeGreaterThanOrEqual(0);
    expect(methods.indexOf("deleteFrom")).toBeLessThan(methods.indexOf("insertInto"));
    expect(callsFor(spy.calls, "deleteFrom")[0].args).toEqual(["songRankingCache"]);
    expect(callsFor(spy.calls, "where")[0].args).toEqual(["version", "=", "33"]);
    expect(callsFor(spy.calls, "values")[0].args[0]).toHaveLength(2);
  });

  it("新しい行が空でも、既存行の削除は行い、INSERTはしないこと", async () => {
    const spy = createTransactionalDbSpy();
    dbHolder.current = spy;

    await songRankingCacheRepo.replaceForVersion("33", []);

    expect(callsFor(spy.calls, "deleteFrom")).toHaveLength(1);
    expect(callsFor(spy.calls, "insertInto")).toHaveLength(0);
  });

  it("2000行を超える場合は2000行ずつに分けて書き込むこと", async () => {
    const spy = createTransactionalDbSpy();
    dbHolder.current = spy;
    const rows = Array.from({ length: 4500 }, (_, i) => row(`u${i}`, 1));

    await songRankingCacheRepo.replaceForVersion("33", rows);

    const chunks = callsFor(spy.calls, "values").map(
      (c) => (c.args[0] as unknown[]).length,
    );
    expect(chunks).toEqual([2000, 2000, 500]);
  });
});
