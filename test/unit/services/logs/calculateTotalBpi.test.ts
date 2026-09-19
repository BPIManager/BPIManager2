import { describe, it, expect, vi, beforeEach } from "vitest";

const calculateTotalBPIMock = vi.fn();

vi.mock("@/lib/bpi", () => ({
  BpiCalculator: {
    calculateTotalBPI: (...a: unknown[]) => calculateTotalBPIMock(...a),
    ratchetTotalBpi: (previousBest: number | null, freshValue: number) =>
      previousBest !== null ? Math.max(previousBest, freshValue) : freshValue,
  },
}));

import { calculateTotalBpi } from "@/services/logs/calculateTotalBpi";

describe("calculateTotalBpi", () => {
  beforeEach(() => {
    calculateTotalBPIMock.mockReset();
  });

  it("未プレイ曲の予測下振れで生の総合BPIが下がっても、記録上は既知の最高値を下回らない(ラチェット)", () => {
    // 3日分。2日目は生の総合BPIが1日目より下がるが、表示上は下回らないはず
    calculateTotalBPIMock
      .mockReturnValueOnce(50) // day1
      .mockReturnValueOnce(45) // day2 (下振れ)
      .mockReturnValueOnce(55); // day3 (再度上昇)

    const scores = [
      { songId: 1, bpi: 50, exScore: 900, notes: 1000, difficultyLevel: 12, title: "a", playDay: "2024-01-01", batchId: "b1" },
      { songId: 2, bpi: 45, exScore: 800, notes: 1000, difficultyLevel: 12, title: "b", playDay: "2024-01-02", batchId: "b2" },
      { songId: 3, bpi: 55, exScore: 950, notes: 1000, difficultyLevel: 12, title: "c", playDay: "2024-01-03", batchId: "b3" },
    ];

    const timeline = calculateTotalBpi(scores, [], "31", 0);

    // timelineは新しい日付が先頭(降順)
    expect(timeline.map((t) => t.totalBpi)).toEqual([55, 50, 50]);
    // diffはラチェット後の値同士の差分であるべき(3日目は+5、2日目は0)
    expect(timeline.map((t) => t.diff)).toEqual([5, 0, 0]);
  });

  it("同日内の複数バッチで一時的なピークがあれば、その日の表示値はピークを保持する(バッチ単位でratchet)", () => {
    calculateTotalBPIMock
      .mockReturnValueOnce(28.29) // batch1 (同日、早い時刻)
      .mockReturnValueOnce(26.2); // batch2 (同日、後の時刻、下振れ)

    const scores = [
      {
        songId: 1,
        bpi: 28.29,
        exScore: 900,
        notes: 1000,
        difficultyLevel: 12,
        title: "a",
        lastPlayed: "2026-09-16T02:44:49.000Z",
        batchId: "batch-1",
        logId: 1,
      },
      {
        songId: 2,
        bpi: 20,
        exScore: 700,
        notes: 1000,
        difficultyLevel: 12,
        title: "b",
        lastPlayed: "2026-09-16T10:00:00.000Z",
        batchId: "batch-2",
        logId: 2,
      },
    ];

    const timeline = calculateTotalBpi(scores, [], "34", 5);

    expect(calculateTotalBPIMock).toHaveBeenCalledTimes(2);
    expect(timeline.map((t) => t.totalBpi)).toEqual([28.29]);
  });

  it("同一バッチ内の各曲のlastPlayedが同日内でバラバラでも、1ステップとしてまとめて計算する", () => {
    calculateTotalBPIMock.mockReturnValueOnce(30.3); // batch1のみ(1回だけ呼ばれる)

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
        logId: 1,
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
        logId: 2,
      },
    ];

    const timeline = calculateTotalBpi(scores, [], "34", 5);

    expect(calculateTotalBPIMock).toHaveBeenCalledTimes(1);
    expect(timeline.map((t) => t.totalBpi)).toEqual([30.3]);
  });

  it("同一バッチが複数日にまたがる場合(一括の過去データインポート等)は日ごとにステップを分けて推移を再現する", () => {
    // 1回の巨大バッチで2日分のスコアが一括インポートされたケース
    calculateTotalBPIMock
      .mockReturnValueOnce(20) // day1時点(1曲目のみ反映)
      .mockReturnValueOnce(33.45); // day2時点(2曲目も反映後、最終状態)

    const scores = [
      {
        songId: 1,
        bpi: 20,
        exScore: 800,
        notes: 1000,
        difficultyLevel: 12,
        title: "old",
        lastPlayed: "2025-09-22T00:00:00.000Z",
        batchId: "batch-bulk",
        logId: 1,
      },
      {
        songId: 2,
        bpi: 33.45,
        exScore: 950,
        notes: 1000,
        difficultyLevel: 12,
        title: "recent",
        lastPlayed: "2026-09-14T00:00:00.000Z",
        batchId: "batch-bulk",
        logId: 2,
      },
    ];

    const timeline = calculateTotalBpi(scores, [], "34", 5);

    expect(calculateTotalBPIMock).toHaveBeenCalledTimes(2);
    // 新しい日付が先頭。同じバッチでも日付ごとに異なる値が再現される
    expect(timeline.map((t) => ({ date: t.id, totalBpi: t.totalBpi }))).toEqual([
      { date: "2026-09-14", totalBpi: 33.45 },
      { date: "2025-09-22", totalBpi: 20 },
    ]);
  });
});
