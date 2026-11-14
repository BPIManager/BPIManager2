// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { SongWithScore } from "@/types/songs/score";

const push = vi.fn();
const replace = vi.fn();
let query: Record<string, string> = {};

vi.mock("next/router", () => ({
  useRouter: () => ({ query, isReady: true, push, replace }),
}));

const { useSongFilter } = await import("@/hooks/table/useSongFilter");

const song = (songId: number, exScore: number | null) =>
  ({
    songId,
    title: `s${songId}`,
    difficulty: "ANOTHER",
    difficultyLevel: 12,
    bpm: "150",
    releasedVersion: 30,
    exScore,
    clearState: null,
    rival: { exScore: 1000, bpi: 0, clearState: null, missCount: null, lastPlayed: null },
  }) as unknown as SongWithScore;

const data = [song(1, 900), song(2, null)];
const defaults = { isMyPlayed: true, isRivalPlayed: true } as const;

beforeEach(() => {
  push.mockClear();
  replace.mockClear();
  query = { levels: "12", difficulties: "ANOTHER" };
});

describe("useSongFilter プレイ状態の3状態", () => {
  it("未指定は既定(プレイ済のみ)、falseは未プレイのみ、anyは両方を表示する", () => {
    const ids = (q: Record<string, string>) => {
      query = { levels: "12", difficulties: "ANOTHER", ...q };
      const { result } = renderHook(() => useSongFilter(data, defaults));
      return result.current.displaySongs.map((s) => s.songId);
    };
    expect(ids({})).toEqual([1]);
    expect(ids({ isMyPlayed: "true" })).toEqual([1]);
    expect(ids({ isMyPlayed: "false" })).toEqual([2]);
    expect(ids({ isMyPlayed: "any" }).sort()).toEqual([1, 2]);
  });

  it("両方(null)はURLに any として書き込み、他のnull値は削除する", () => {
    const { result } = renderHook(() => useSongFilter(data, defaults));
    act(() => result.current.updateParams({ isMyPlayed: null, search: "" }));
    expect(push).toHaveBeenCalledTimes(1);
    const nextQuery = push.mock.calls[0][0].query;
    expect(nextQuery.isMyPlayed).toBe("any");
    expect(nextQuery.search).toBeUndefined();
  });
});
