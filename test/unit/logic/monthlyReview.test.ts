import { describe, it, expect } from "vitest";
import {
  toPlayDateStr,
  buildActivityBreakdown,
  buildBestDays,
} from "@/lib/monthly-review/activity";
import { buildArena } from "@/lib/monthly-review/arena";
import { buildBpiTimeline } from "@/lib/monthly-review/bpi";
import { buildRivals, buildGrowthRanking } from "@/lib/monthly-review/rivals";
import { buildTopSongs } from "@/lib/monthly-review/topSongs";

describe("toPlayDateStr", () => {
  it("Dateインスタンスを YYYY-MM-DD に整形すること", () => {
    expect(toPlayDateStr(new Date("2025-06-15T00:00:00Z"))).toBe(
      "2025-06-15",
    );
  });

  it("文字列は先頭10文字を切り出すこと", () => {
    expect(toPlayDateStr("2025-06-15 12:00:00")).toBe("2025-06-15");
  });

  it("それ以外の値は1970-01-01を返すこと", () => {
    expect(toPlayDateStr(null)).toBe("1970-01-01");
    expect(toPlayDateStr(undefined)).toBe("1970-01-01");
  });
});

describe("buildActivityBreakdown", () => {
  it("MySQLのDOW(日=1始まり)をアプリ内の曜日インデックス(月=0)に変換し集計すること", () => {
    // MySQL DOW=1(日曜) -> app day 6 / DOW=2(月曜) -> app day 0
    const result = buildActivityBreakdown([
      { dow: 1, hour: 10, count: 3 },
      { dow: 2, hour: 10, count: 5 },
    ]);

    expect(result.byDayOfWeek[6].count).toBe(3);
    expect(result.byDayOfWeek[0].count).toBe(5);
    expect(result.byHour[10].count).toBe(8);
  });

  it("データがない曜日/時間帯は0になること", () => {
    const result = buildActivityBreakdown([]);
    expect(result.byDayOfWeek).toHaveLength(7);
    expect(result.byDayOfWeek.every((d) => d.count === 0)).toBe(true);
    expect(result.byHour).toHaveLength(24);
  });
});

describe("buildBestDays", () => {
  it("鍵盤/スクラッチ最多日とBPI最大成長日を抽出すること", () => {
    const result = buildBestDays(
      [
        { playDate: "2025-06-01", keyCount: 100, scratchCount: 10 },
        { playDate: "2025-06-02", keyCount: 300, scratchCount: 5 },
      ],
      [
        { date: "2025-06-01", value: 10 },
        { date: "2025-06-02", value: 15 },
      ],
      5,
    );

    expect(result.bestKeysDay).toEqual({ date: "2025-06-02", keyCount: 300 });
    expect(result.bestScratchDay).toEqual({
      date: "2025-06-01",
      scratchCount: 10,
    });
    expect(result.bestGrowthDay).toEqual({ date: "2025-06-01", bpiDiff: 5 });
  });

  it("dailyTowerDataが空の場合はnullを返すこと", () => {
    const result = buildBestDays([], [], 0);
    expect(result.bestKeysDay).toBeNull();
    expect(result.bestScratchDay).toBeNull();
  });
});

describe("buildArena", () => {
  it("最も上位のクラスと対応する順位を返すこと", () => {
    const result = buildArena([
      { arenaClass: "A3", arenaRank: 10, a1continue: null },
      { arenaClass: "A1", arenaRank: 2, a1continue: 3 },
      { arenaClass: "A2", arenaRank: 5, a1continue: 5 },
    ]);

    expect(result).toEqual({ bestClass: "A1", bestRank: 2, maxA1Continue: 5 });
  });

  it("空配列の場合はnullを返すこと", () => {
    expect(buildArena([])).toBeNull();
  });

  it("ARENA_RANK_ORDERに含まれない未知のarenaClassをベストクラス候補から除外すること", () => {
    const result = buildArena([
      { arenaClass: "UNKNOWN", arenaRank: 1, a1continue: null },
      { arenaClass: "A2", arenaRank: 5, a1continue: null },
    ]);

    expect(result).toEqual({ bestClass: "A2", bestRank: 5, maxA1Continue: null });
  });
});

describe("buildBpiTimeline", () => {
  it("楽曲の月内スコア更新に応じて総合BPI推移を構築すること", () => {
    const preMap = new Map([
      [1, 10],
      [2, 20],
    ]);
    const result = buildBpiTimeline(
      preMap,
      [{ songId: 1, bpi: 40, lastPlayed: "2025-06-05T00:00:00Z" }],
      2,
      false,
    );

    expect(result.history).toHaveLength(1);
    expect(result.history[0].date).toBe("2025-06-05");
    expect(result.bpiEnd).toBeGreaterThan(result.bpiStart);
    expect(result.finalBpiMap.get(1)).toBe(40);
  });

  it("月内エントリがない場合はhistoryが空でbpiStart=bpiEndになること", () => {
    const preMap = new Map([[1, 10]]);
    const result = buildBpiTimeline(preMap, [], 1, false);
    expect(result.history).toEqual([]);
    expect(result.bpiStart).toBe(result.bpiEnd);
  });
});

describe("buildRivals", () => {
  const userCurrent = [
    {
      songId: 1,
      exScore: 1800,
      title: "冥",
      difficulty: "ANOTHER",
      difficultyLevel: 12,
    },
  ];

  it("ユーザーがライバルに勝っている曲をtopWinningSongsに含めること", () => {
    const rivals = buildRivals(
      userCurrent,
      [
        {
          userId: "rival-1",
          userName: "ライバル",
          profileImage: null,
          songId: 1,
          exScore: 1500,
        },
      ],
      new Map(),
    );

    expect(rivals).toHaveLength(1);
    expect(rivals[0].topWinningSongs).toHaveLength(1);
    expect(rivals[0].topWinningSongs[0].margin).toBe(300);
  });

  it("月初は負けていて現在勝っている場合newWinsが増えること", () => {
    const rivals = buildRivals(
      userCurrent,
      [
        {
          userId: "rival-1",
          userName: "ライバル",
          profileImage: null,
          songId: 1,
          exScore: 1700,
        },
      ],
      new Map([[1, 1600]]), // 月初のユーザースコアはライバルより低かった
    );

    expect(rivals[0].newWins).toBe(1);
    expect(rivals[0].newLosses).toBe(0);
  });

  it("勝敗差分もwinningSongsも無いライバルは除外されること", () => {
    const rivals = buildRivals(
      userCurrent,
      [
        {
          userId: "rival-1",
          userName: "ライバル",
          profileImage: null,
          songId: 999, // ユーザーが未プレイの曲のみ
          exScore: 1000,
        },
      ],
      new Map(),
    );
    expect(rivals).toHaveLength(0);
  });
});

describe("buildGrowthRanking", () => {
  it("viewerを含めた成長率ランキングを構築すること", () => {
    const result = buildGrowthRanking(
      [
        {
          userId: "rival-1",
          userName: "ライバル",
          profileImage: null,
          newWins: 0,
          newLosses: 0,
          topWinningSongs: [],
          bpiStart: 0,
          bpiEnd: 10,
          bpiGrowth: 10,
        },
      ],
      "viewer-1",
      5,
      0,
    );

    expect(result?.byAbsGrowth[0].userId).toBe("rival-1");
    expect(result?.byAbsGrowth.map((e) => e.userId)).toContain("viewer-1");
  });

  it("ライバルがいない場合でもviewerのエントリのみ返すこと", () => {
    const result = buildGrowthRanking([], "viewer-1", 5, 0);
    expect(result?.byAbsGrowth).toHaveLength(1);
    expect(result?.byAbsGrowth[0].isViewer).toBe(true);
  });
});

describe("buildTopSongs", () => {
  it("bpi降順のtopBpiSongsとdiff降順のtopImprovedSongsを構築すること", () => {
    const result = buildTopSongs(
      [
        {
          songId: 1,
          title: "A",
          difficulty: "ANOTHER",
          difficultyLevel: 12,
          bpi: 20,
          exScore: 1500,
          notes: 1000,
          logId: 1,
        },
        {
          songId: 2,
          title: "B",
          difficulty: "ANOTHER",
          difficultyLevel: 12,
          bpi: 40,
          exScore: 1800,
          notes: 1000,
          logId: 2,
        },
      ],
      new Map([
        [1, { exScore: 1400, bpi: 15 }],
        [2, { exScore: 1700, bpi: 10 }],
      ]),
    );

    expect(result.topBpiSongs.map((s) => s.songId)).toEqual([2, 1]);
    expect(result.topImprovedSongs.map((s) => s.songId)).toEqual([2, 1]);
    expect(result.topImprovedSongs[0].diff).toBe(30);
  });

  it("bpiがnullの曲は除外されること", () => {
    const result = buildTopSongs(
      [
        {
          songId: 1,
          title: "A",
          difficulty: "ANOTHER",
          difficultyLevel: 12,
          bpi: null,
          exScore: 1500,
          notes: 1000,
          logId: 1,
        },
      ],
      new Map(),
    );
    expect(result.topBpiSongs).toHaveLength(0);
  });
});
