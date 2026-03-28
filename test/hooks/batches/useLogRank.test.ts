// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLogRank } from "@/hooks/batches/useLogRank";
import type { BatchDetailItem } from "@/types/logs/batchDetail";

const makeItem = (
  songId: number,
  currentBpi: number,
  diffBpi: number,
  hasPrevious = true,
): BatchDetailItem => ({
  songId,
  title: `Song ${songId}`,
  notes: 1000,
  difficulty: "ANOTHER",
  difficultyLevel: 12,
  level: 12,
  current: {
    exScore: 800,
    bpi: currentBpi,
    clearState: "CLEAR",
    missCount: 5,
    lastPlayedAt: "2024-01-01T00:00:00Z",
  },
  previous: hasPrevious
    ? {
        exScore: 700,
        bpi: currentBpi - diffBpi,
        clearState: "CLEAR",
        missCount: 10,
      }
    : null,
  diff: {
    exScore: 100,
    bpi: diffBpi,
  },
  overtaken: [],
});

describe("useLogRank", () => {
  const details: BatchDetailItem[] = [
    makeItem(1, 50, 10),
    makeItem(2, 80, 5),
    makeItem(3, 20, -3), // diff が負なので growth では除外
    makeItem(4, 60, 15),
    makeItem(5, 90, 20),
    makeItem(6, 10, 8),
    makeItem(7, 40, 0), // diff === 0 なので growth では除外
  ];

  describe("type: growth", () => {
    it("BPI 成長量の降順で並ぶ", () => {
      const { result } = renderHook(() => useLogRank(details, "growth"));
      const bpis = result.current.visibleSongs.map((s) => s.diff.bpi);
      expect(bpis[0]).toBeGreaterThanOrEqual(bpis[1]);
    });

    it("diff.bpi が 0 以下の曲は除外される", () => {
      const { result } = renderHook(() => useLogRank(details, "growth"));
      const allSongs = result.current.visibleSongs;
      expect(allSongs.every((s) => s.diff.bpi > 0)).toBe(true);
    });
  });

  describe("type: top", () => {
    it("current.bpi の降順で並ぶ", () => {
      const { result } = renderHook(() => useLogRank(details, "top"));
      const bpis = result.current.visibleSongs.map((s) => s.current.bpi);
      for (let i = 0; i < bpis.length - 1; i++) {
        expect(bpis[i]).toBeGreaterThanOrEqual(bpis[i + 1]);
      }
    });
  });

  describe("hideNewRecords", () => {
    it("デフォルトは false（新規記録を含む）", () => {
      const { result } = renderHook(() => useLogRank(details, "growth"));
      expect(result.current.hideNewRecords).toBe(false);
    });

    it("true にすると previous がない曲が除外される", () => {
      const withNewRecord = [
        ...details,
        makeItem(99, 70, 25, false), // previous なし = 新規記録
      ];
      const { result } = renderHook(() =>
        useLogRank(withNewRecord, "growth"),
      );

      act(() => {
        result.current.setHideNewRecords(true);
      });

      expect(result.current.visibleSongs.every((s) => s.previous !== null)).toBe(
        true,
      );
    });
  });

  describe("ページング", () => {
    it("初期表示は 5 件", () => {
      const { result } = renderHook(() => useLogRank(details, "top"));
      expect(result.current.visibleSongs.length).toBeLessThanOrEqual(5);
    });

    it("loadMore で 10 件追加される", () => {
      const manyDetails = Array.from({ length: 20 }, (_, i) =>
        makeItem(i + 1, 50 - i, 5),
      );
      const { result } = renderHook(() => useLogRank(manyDetails, "top"));

      const initialLength = result.current.visibleSongs.length;
      expect(result.current.hasMore).toBe(true);

      act(() => {
        result.current.loadMore();
      });

      expect(result.current.visibleSongs.length).toBe(initialLength + 10);
    });

    it("hasMore は全件表示後に false", () => {
      const { result } = renderHook(() => useLogRank(details, "top"));

      act(() => {
        result.current.setDisplayLimit(1000);
      });

      expect(result.current.hasMore).toBe(false);
      // remainingCount は displayLimit が total を超えると負になる
      expect(result.current.remainingCount).toBeLessThanOrEqual(0);
    });
  });
});
