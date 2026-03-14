import { describe, it, expect } from "vitest";
import { parseCSV } from "@/utils/csv/parse";
import dayjs from "@/lib/dayjs";
import fs from "fs";
import path from "path";
import { BpiCalculator } from "@/lib/bpi";
import { IIDX_DIFFICULTIES } from "@/constants/diffs";
import { isImproved } from "@/lib/lamp";

describe("CSV Parser Test", () => {
  it("CSV文字列が正しくJSONオブジェクトの配列に変換されること", () => {
    const csvPath = path.join(__dirname, "./resources/testCsv.csv");
    const csvData = fs.readFileSync(csvPath, "utf-8");

    const result = parseCSV(csvData);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((r) => {
      if (!r) return;
      expect(IIDX_DIFFICULTIES).toContain(r.difficulty);
    });
  });

  it("エッジケース: ミスカウント '---' は null として処理されること", () => {
    const csvData = `タイトル,ANOTHER 難易度,ANOTHER クリアタイプ,ANOTHER スコア,ANOTHER ミスカウント,最終プレー日時\n"Test Song",12,CLEAR,2000,---,2025-01-01 12:00`;
    const result = parseCSV(csvData);
    expect(result[0]?.missCount).toBeNull();
  });
});

describe("Server-side Import Logic Simulation", () => {
  const mockSongMaster = {
    songId: 100,
    title: "冥",
    difficulty: "ANOTHER",
    notes: 2000,
    kaidenAvg: 2200,
    wrScore: 2800,
    coef: 1.175,
  };

  describe("Timezone Conversion (JST to UTC)", () => {
    it("JSTのプレー日時が正しく UTC に変換されること", () => {
      const jstDateStr = "2025-09-18 18:05";
      const utcDate = dayjs.tz(jstDateStr).utc();

      expect(utcDate.hour()).toBe(9); // 18JST = 09UTC
      expect(utcDate.format("YYYY-MM-DD HH:mm")).toBe("2025-09-18 09:05");
    });
  });

  describe("Score Improvement Logic", () => {
    const currentScore = {
      exScore: 2000,
      clearState: "CLEAR",
      missCount: 20,
    };

    it("スコアが同じでもランプが更新されていれば更新対象となること", () => {
      const row = { exScore: 2000, clearState: "HARD CLEAR", missCount: 20 };
      const lampBetter = isImproved(row.clearState, currentScore.clearState);
      expect(lampBetter).toBe(true);
    });

    it("ミスカウントが 0 (数値) の場合も正しく改善と判定されること", () => {
      const row = { exScore: 2000, clearState: "CLEAR", missCount: 0 };
      const currentMiss = currentScore.missCount;
      const newMiss = row.missCount;

      const missBetter =
        newMiss !== null && (currentMiss === null || newMiss < currentMiss);
      expect(missBetter).toBe(true);
    });
  });

  describe("BPI Integration in Bulk", () => {
    it("理論値を超えるスコアが入力された際、BPI計算がnullを返すこと", () => {
      const overMaxScore = 5000;
      const bpi = BpiCalculator.calc(overMaxScore, mockSongMaster);
      expect(bpi).toBeNull();
    });
  });
});
