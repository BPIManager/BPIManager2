import { beforeEach, describe, expect, it, vi } from "vitest";

const getAll = vi.fn();
vi.mock("@/lib/db/domains/songs/master", () => ({
  songMasterRepo: { getAllSongsWithCurrentDef: (...a: unknown[]) => getAll(...a) },
}));

const row = (title: string) => ({ title, difficulty: "ANOTHER", songId: 1 });

describe("songDefs キャッシュ", () => {
  beforeEach(() => {
    vi.resetModules();
    getAll.mockReset();
  });

  it("invalidate 後は再読み込みされる", async () => {
    getAll.mockResolvedValueOnce([row("A")]).mockResolvedValueOnce([row("B")]);
    const m = await import("@/lib/cache/songDefs");
    expect(await m.getSongWithDefCached("A", "ANOTHER")).not.toBeNull();
    m.invalidateSongDefsCache();
    expect(await m.getSongWithDefCached("A", "ANOTHER")).toBeNull();
    expect(await m.getSongWithDefCached("B", "ANOTHER")).not.toBeNull();
  });

  it("読み込み中に invalidate しても、古いデータでキャッシュを上書きしない", async () => {
    let release!: (v: unknown[]) => void;
    getAll.mockReturnValueOnce(new Promise((r) => (release = r))).mockResolvedValueOnce([row("B")]);
    const m = await import("@/lib/cache/songDefs");
    const first = m.getSongWithDefCached("A", "ANOTHER");
    m.invalidateSongDefsCache();
    release([row("A")]);
    await first;
    expect(await m.getSongWithDefCached("B", "ANOTHER")).not.toBeNull();
  });
});
