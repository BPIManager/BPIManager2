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

const { songsRepo } = await import("@/lib/db/domains/songs");

describe("songsRepo.getSongMasterWithDef", () => {
  it("songsとsongDefを結合したクエリを実行し結果を返すこと", async () => {
    const rows = [{ songId: 1, title: "冥" }];
    dbHolder.current = createDbSpy(rows);

    const result = await songsRepo.getSongMasterWithDef();

    expect(result).toEqual(rows);
    expect(callsFor(dbHolder.current.calls, "selectFrom")[0].args).toEqual([
      "songs as s",
    ]);
  });
});

describe("songsRepo.getSongWithDefByTitleDifficulty", () => {
  it("title/difficultyで楽曲を検索すること", async () => {
    dbHolder.current = createDbSpy({ songId: 1 });
    const result = await songsRepo.getSongWithDefByTitleDifficulty(
      "冥",
      "ANOTHER",
    );
    expect(result).toEqual({ songId: 1 });
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls[0].args).toEqual(["s.title", "=", "冥"]);
    expect(whereCalls[1].args).toEqual(["s.difficulty", "=", "ANOTHER"]);
  });
});

describe("songsRepo.getSongList", () => {
  it("INF以外のバージョンでは$ifにtrueを渡すこと", async () => {
    dbHolder.current = createDbSpy([]);
    await songsRepo.getSongList("33");
    expect(callsFor(dbHolder.current.calls, "$if")[0].args[0]).toBe(true);
  });

  it("INFバージョンでは$ifにfalseを渡すこと", async () => {
    dbHolder.current = createDbSpy([]);
    await songsRepo.getSongList("INF");
    expect(callsFor(dbHolder.current.calls, "$if")[0].args[0]).toBe(false);
  });

  it("title→difficulty順でソートされること", async () => {
    dbHolder.current = createDbSpy([]);
    await songsRepo.getSongList("33");
    const orderByCalls = callsFor(dbHolder.current.calls, "orderBy");
    expect(orderByCalls[0].args).toEqual(["s.title", "asc"]);
    expect(orderByCalls[1].args).toEqual(["s.difficulty", "asc"]);
  });
});

describe("songsRepo.getSongById", () => {
  it("songIdで楽曲を検索すること", async () => {
    const row = { songId: 1, title: "冥" };
    dbHolder.current = createDbSpy(row);
    const result = await songsRepo.getSongById(1);
    expect(result).toEqual(row);
    expect(callsFor(dbHolder.current.calls, "where")[0].args).toEqual([
      "s.songId",
      "=",
      1,
    ]);
  });
});

describe("songsRepo.getSimilarSongs", () => {
  const baseSong = {
    songId: 0,
    title: "",
    difficulty: "ANOTHER",
    difficultyLevel: 12,
    notes: 1000,
    bpm: "200",
    p_scratch: 0,
    p_soflan: 0,
    p_cn: 0,
    p_chord: 0,
    p_intensity: 0,
    p_udeoshi: 0,
    p_delay: 0,
    p_scratch_complex: 0,
    p_tateren: 0,
    p_trill_denim: 0,
    p_peak: 0,
  };

  it("基準楽曲が見つからない場合、空配列を返すこと", async () => {
    dbHolder.current = createDbSpy([{ ...baseSong, songId: 2, title: "他の曲" }]);
    const result = await songsRepo.getSimilarSongs(999, "33");
    expect(result).toEqual([]);
  });

  it("距離が近い順にソートし、自分自身を除外すること", async () => {
    dbHolder.current = createDbSpy([
      { ...baseSong, songId: 1, title: "基準曲", p_scratch: 0 },
      { ...baseSong, songId: 2, title: "近い曲", p_scratch: 1 },
      { ...baseSong, songId: 3, title: "遠い曲", p_scratch: 10 },
    ]);

    const result = await songsRepo.getSimilarSongs(1, "33");

    expect(result.map((r) => r.songId)).toEqual([2, 3]);
    expect(result[0].distance).toBeLessThan(result[1].distance);
  });

  it("limitで返却件数を絞れること", async () => {
    dbHolder.current = createDbSpy([
      { ...baseSong, songId: 1, title: "基準曲" },
      { ...baseSong, songId: 2, title: "曲2", p_scratch: 1 },
      { ...baseSong, songId: 3, title: "曲3", p_scratch: 2 },
      { ...baseSong, songId: 4, title: "曲4", p_scratch: 3 },
    ]);

    const result = await songsRepo.getSimilarSongs(1, "33", 2);

    expect(result).toHaveLength(2);
  });
});
