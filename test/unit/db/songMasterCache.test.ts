import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createQueryBuilderSpy, callsFor } from "../helpers/dbQuerySpy";

const { holder } = vi.hoisted(() => ({
  holder: {
    current: null as ReturnType<
      typeof import("../helpers/dbQuerySpy")["createQueryBuilderSpy"]
    > | null,
  },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return holder.current!.proxy;
  },
}));

const { songMasterRepo } = await import("@/lib/db/domains/songs/master");

describe("songMasterRepo.getSongMasterWithDef のキャッシュ", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    holder.current = createQueryBuilderSpy([{ songId: 1 }]);
    songMasterRepo.invalidateSongMasterCache();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const queries = () => callsFor(holder.current!.calls, "selectFrom").length;

  it("TTL内の2回目以降はDBを引かないこと", async () => {
    await songMasterRepo.getSongMasterWithDef();
    await songMasterRepo.getSongMasterWithDef();
    expect(queries()).toBe(1);
  });

  it("同時呼び出しは1回のクエリを共有すること", async () => {
    await Promise.all([
      songMasterRepo.getSongMasterWithDef(),
      songMasterRepo.getSongMasterWithDef(),
    ]);
    expect(queries()).toBe(1);
  });

  it("TTL経過後は再取得すること", async () => {
    await songMasterRepo.getSongMasterWithDef();
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    await songMasterRepo.getSongMasterWithDef();
    expect(queries()).toBe(2);
  });

  it("trx指定時はキャッシュを使わずtrxで直接読むこと", async () => {
    await songMasterRepo.getSongMasterWithDef();
    const trxSpy = createQueryBuilderSpy([{ songId: 2 }]);
    const rows = await songMasterRepo.getSongMasterWithDef(trxSpy.proxy as never);
    expect(rows).toEqual([{ songId: 2 }]);
    expect(callsFor(trxSpy.calls, "selectFrom")).toHaveLength(1);
  });

  it("呼び出し側が返却配列を並べ替えてもキャッシュに影響しないこと", async () => {
    const first = await songMasterRepo.getSongMasterWithDef();
    first.length = 0;
    const second = await songMasterRepo.getSongMasterWithDef();
    expect(second).toHaveLength(1);
  });
});
