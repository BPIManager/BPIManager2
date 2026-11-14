import { describe, it, expect } from "vitest";
import {
  radarValuesFromRow,
  radarValuesToColumns,
  ratchetRadarValues,
  type RadarValues,
} from "@/lib/radar/snapshot";

const values = (v: Partial<RadarValues>): RadarValues => ({
  NOTES: 0,
  CHORD: 0,
  PEAK: 0,
  CHARGE: 0,
  SCRATCH: 0,
  SOFLAN: 0,
  ...v,
});

describe("ratchetRadarValues", () => {
  it("履歴が無ければ今回の値をそのまま使う", () => {
    expect(ratchetRadarValues(null, values({ NOTES: 10 })).NOTES).toBe(10);
  });

  it("カテゴリごとに、過去最高を下回らない値を返す", () => {
    const result = ratchetRadarValues(
      values({ NOTES: 20, CHORD: 5 }),
      values({ NOTES: 18, CHORD: 7 }),
    );
    expect(result.NOTES).toBe(20);
    expect(result.CHORD).toBe(7);
  });

  it("有限でない新値は採用せず過去最高を維持する", () => {
    const result = ratchetRadarValues(values({ PEAK: 3 }), values({ PEAK: Number.NaN }));
    expect(result.PEAK).toBe(3);
  });
});

describe("radarValuesFromRow / radarValuesToColumns", () => {
  it("decimal(文字列)を数値に戻し、小数第2位に丸めた文字列にして保存する", () => {
    const row = {
      notes: "12.50",
      chord: "-15.00",
      peak: null,
      charge: "0.00",
      scratch: "7.01",
      soflan: "100.00",
    };
    const v = radarValuesFromRow(row);
    expect(v).toEqual({ NOTES: 12.5, CHORD: -15, PEAK: -15, CHARGE: 0, SCRATCH: 7.01, SOFLAN: 100 });
    expect(radarValuesToColumns({ ...v, NOTES: 12.345 }).notes).toBe("12.35");
  });
});

describe("computeRadarValues", () => {
  it("☆12かつ対象難易度のスコアだけをレーダー計算に渡す", async () => {
    const { vi } = await import("vitest");
    const captured: { title: string }[][] = [];
    vi.resetModules();
    vi.doMock("@/lib/radar/calculator", () => ({
      buildRadarSongMaster: () => new Map(),
      calculateRadar: (scores: { title: string }[]) => {
        captured.push(scores);
        return Object.fromEntries(
          ["NOTES", "CHORD", "PEAK", "CHARGE", "SCRATCH", "SOFLAN"].map((c) => [c, { totalBpi: 0, songs: [] }]),
        );
      },
    }));
    const { computeRadarValues } = await import("@/lib/radar/snapshot");
    const master = [
      { songId: 1, title: "L12 another", difficulty: "ANOTHER", difficultyLevel: 12, notes: 1000 },
      { songId: 2, title: "L11 another", difficulty: "ANOTHER", difficultyLevel: 11, notes: 1000 },
      { songId: 3, title: "L12 normal", difficulty: "NORMAL", difficultyLevel: 12, notes: 1000 },
    ] as unknown as Parameters<typeof computeRadarValues>[1];
    computeRadarValues(
      [
        { songId: 1, exScore: 1800, bpi: 1 },
        { songId: 2, exScore: 1800, bpi: 1 },
        { songId: 3, exScore: 1800, bpi: 1 },
        { songId: 99, exScore: 1800, bpi: 1 },
      ],
      master,
      new Set(),
    );
    expect(captured[0].map((s) => s.title)).toEqual(["L12 another"]);
    vi.doUnmock("@/lib/radar/calculator");
  });
});
