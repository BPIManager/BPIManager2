import { describe, it, expect } from "vitest";
import { calculateTotalBpi } from "@/services/logs/calculateTotalBpi";

describe("calculateTotalBpi", () => {
  it("バッチ別の総合BPI(logs.totalBpi)をそのまま日別タイムラインに反映する", () => {
    const scores = [
      {
        songId: 1,
        bpi: 50,
        exScore: 900,
        notes: 1000,
        difficultyLevel: 12,
        title: "a",
        playDay: "2024-01-01",
        batchId: "batch-1",
      },
      {
        songId: 2,
        bpi: 45,
        exScore: 800,
        notes: 1000,
        difficultyLevel: 12,
        title: "b",
        playDay: "2024-01-02",
        batchId: "batch-2",
      },
      {
        songId: 3,
        bpi: 55,
        exScore: 950,
        notes: 1000,
        difficultyLevel: 12,
        title: "c",
        playDay: "2024-01-03",
        batchId: "batch-3",
      },
    ];
    // id昇順(処理順)。executeSaveBpiSystem側で既にratchet済みの値
    const batchTotalBpis = [
      { batchId: "batch-1", totalBpi: 50 },
      { batchId: "batch-2", totalBpi: 45 }, // 生の値としては下振れ
      { batchId: "batch-3", totalBpi: 55 },
    ];

    const timeline = calculateTotalBpi(scores, batchTotalBpis, "31", 0);

    // timelineは新しい日付が先頭(降順)
    expect(timeline.map((t) => t.totalBpi)).toEqual([55, 50, 50]);
    // diffはラチェット後の値同士の差分であるべき(3日目は+5、2日目は0)
    expect(timeline.map((t) => t.diff)).toEqual([5, 0, 0]);
  });

  it("同日内の複数バッチでは、最後に処理されたバッチのtotalBpiをその日の値として採用する", () => {
    const scores = [
      {
        songId: 1,
        bpi: 28.2,
        exScore: 900,
        notes: 1000,
        difficultyLevel: 12,
        title: "a",
        lastPlayed: "2026-09-16T02:44:49.000Z",
        batchId: "batch-1",
      },
      {
        songId: 2,
        bpi: 15,
        exScore: 700,
        notes: 1000,
        difficultyLevel: 12,
        title: "b",
        lastPlayed: "2026-09-16T10:00:00.000Z",
        batchId: "batch-2",
      },
    ];
    const batchTotalBpis = [
      { batchId: "batch-1", totalBpi: 28.29 },
      { batchId: "batch-2", totalBpi: 30.3 },
    ];

    const timeline = calculateTotalBpi(scores, batchTotalBpis, "34", 5);

    expect(timeline.map((t) => t.totalBpi)).toEqual([30.3]);
  });

  it("同一バッチ内の各曲のlastPlayedがバラバラでも、バッチのtotalBpiは1つだけ採用する", () => {
    const scores = [
      {
        songId: 1,
        bpi: 28.2,
        exScore: 900,
        notes: 1000,
        difficultyLevel: 12,
        title: "a",
        lastPlayed: "2026-09-18T20:25:00.000Z",
        batchId: "batch-1",
      },
      {
        songId: 2,
        bpi: 15,
        exScore: 700,
        notes: 1000,
        difficultyLevel: 12,
        title: "b",
        lastPlayed: "2026-09-18T22:47:00.000Z",
        batchId: "batch-1",
      },
    ];
    const batchTotalBpis = [{ batchId: "batch-1", totalBpi: 30.3 }];

    const timeline = calculateTotalBpi(scores, batchTotalBpis, "34", 5);

    expect(timeline.map((t) => t.totalBpi)).toEqual([30.3]);
  });
});
