import { describe, it, expect } from "vitest";
import { NewBpiCalculator } from "@/lib/bpi/newBpi";
import { newBpiSongParamMap } from "@/constants/iidx/newBpi/songParams";

describe("NewBpiCalculator ロジックテスト（issue #299〜304 検証用）", () => {
  it("パラメータ未収録の楽曲はnullを返す", () => {
    const unknownSongId = -1;
    expect(NewBpiCalculator.hasParams(unknownSongId)).toBe(false);
    expect(NewBpiCalculator.calc(1000, unknownSongId, 1000)).toBeNull();
  });

  it("パラメータ収録済みの楽曲は有限のBPI値を返す", () => {
    const [songId] = [...newBpiSongParamMap.keys()];
    expect(NewBpiCalculator.hasParams(songId)).toBe(true);

    const bpi = NewBpiCalculator.calc(1000, songId, 1000);
    expect(bpi).not.toBeNull();
    expect(Number.isFinite(bpi)).toBe(true);
  });

  it("スコアが高いほど新方式BPIも高くなる（単調性）", () => {
    const [songId] = [...newBpiSongParamMap.keys()];
    const notes = 1500;
    const low = NewBpiCalculator.calc(1000, songId, notes)!;
    const high = NewBpiCalculator.calc(2500, songId, notes)!;
    expect(high).toBeGreaterThan(low);
  });

  it("現行実装と同じく-15を下限としてクランプする（暫定対応）", () => {
    const [songId] = [...newBpiSongParamMap.keys()];
    const veryLow = NewBpiCalculator.calc(1, songId, 1500)!;
    expect(veryLow).toBe(NewBpiCalculator.BPI_FLOOR);
  });
});
