import { describe, it, expect } from "vitest";
import { getDJRank, getRankIndex } from "@/utils/songs/djRank";
import {
  filterSongsFrontend,
  filterSongsServerSide,
} from "@/utils/songs/filter";
import { getMaxBpm } from "@/utils/songs/getMaxBPM";
import { buildChartViewerUrl, buildTextageUrl } from "@/utils/songs/links";
import {
  getPatternBadge,
  buildTextageUrl as buildPatternTextageUrl,
} from "@/utils/songs/patternUtils";
import { formatRankingRate } from "@/utils/songs/rankingRate";
import { hasBpiData } from "@/utils/songs/songDetailMode";
import {
  filterAndSortSongs,
  getBpmNum,
  getSortValue,
} from "@/utils/songs/songListFilter";
import type { SongWithScore } from "@/types/songs/score";
import type { SongListItem } from "@/types/songs/songInfo";

describe("getRankIndex / getDJRank", () => {
  it("MAX-の割合ではラベルがAAA+または MAX- になること", () => {
    // ちょうど8/9 (=AAAボーダー) の割合
    const label = getDJRank(1778, 2000, { mode: "current", output: "label" });
    expect(["AAA+", "MAX-"]).toContain(label);
  });

  it("50%スコアではcurrentモードでC+ランクになること", () => {
    const label = getDJRank(1000, 2000, { mode: "current", output: "label" });
    expect(label).toBe("C+");
  });

  it("getRankIndexは0%のときF(index 0)を返すこと", () => {
    expect(getRankIndex(0)).toBe(0);
  });
});

describe("getMaxBpm", () => {
  it("固定BPMはそのまま数値化されること", () => {
    expect(getMaxBpm("150")).toBe(150);
  });

  it("ソフラン(範囲表記)は最大値を返すこと", () => {
    expect(getMaxBpm("100-200")).toBe(200);
  });

  it("nullのときは0を返すこと", () => {
    expect(getMaxBpm(null)).toBe(0);
  });
});

describe("filterSongsServerSide", () => {
  const baseSong: SongWithScore = {
    songId: 1,
    title: "冥",
    notes: 1000,
    bpm: "200",
    difficulty: "ANOTHER",
    difficultyLevel: 12,
    releasedVersion: 27,
    logId: 1,
    exScore: 1800,
    bpi: 30,
    clearState: "HARD CLEAR",
    missCount: 5,
    scoreAt: "2025-01-01T00:00:00Z",
    wrScore: 1900,
    kaidenAvg: 1500,
    coef: 1.175,
  };

  it("clearStateが一致しない曲を除外すること", () => {
    const result = filterSongsServerSide([baseSong], {
      clearState: "FULLCOMBO CLEAR",
    });
    expect(result).toHaveLength(0);
  });

  it("bpiMin/bpiMaxの範囲外を除外すること", () => {
    expect(
      filterSongsServerSide([baseSong], { bpiMin: 31 }),
    ).toHaveLength(0);
    expect(
      filterSongsServerSide([baseSong], { bpiMin: 29 }),
    ).toHaveLength(1);
  });

  it("searchはタイトルの部分一致(大文字小文字無視)で絞り込むこと", () => {
    expect(filterSongsServerSide([baseSong], { search: "冥" })).toHaveLength(
      1,
    );
    expect(
      filterSongsServerSide([baseSong], { search: "存在しない曲" }),
    ).toHaveLength(0);
  });
});

describe("filterSongsFrontend", () => {
  const baseSong: SongWithScore = {
    songId: 1,
    title: "冥",
    notes: 1000,
    bpm: "200",
    difficulty: "ANOTHER",
    difficultyLevel: 12,
    releasedVersion: 27,
    logId: 1,
    exScore: 1800,
    bpi: 30,
    clearState: "HARD CLEAR",
    missCount: 5,
    scoreAt: "2025-06-01T00:00:00Z",
  } as SongWithScore;

  it("levelsに含まれない曲を除外すること", () => {
    expect(
      filterSongsFrontend([baseSong], { levels: [11] }),
    ).toHaveLength(0);
    expect(
      filterSongsFrontend([baseSong], { levels: [12] }),
    ).toHaveLength(1);
  });

  it("missCountがnullのときmissCountMin/Max指定があれば除外すること", () => {
    const noMiss = { ...baseSong, missCount: null };
    expect(
      filterSongsFrontend([noMiss], { missCountMin: 0 }),
    ).toHaveLength(0);
  });

  it("scoreFiltersのscoreRateで%閾値未満を除外すること", () => {
    // 1800/2000 = 90%
    const result = filterSongsFrontend([baseSong], {
      scoreFilters: [
        { id: "1", metric: "scoreRate", operator: ">=", value: "95" },
      ],
    });
    expect(result).toHaveLength(0);
  });
});

describe("links: buildTextageUrl / buildChartViewerUrl", () => {
  it("textageがnullのときnullを返すこと", () => {
    expect(buildTextageUrl(null, 1)).toBeNull();
    expect(buildChartViewerUrl(null, "ANOTHER")).toBeNull();
  });

  it("side指定で?1が置き換わること", () => {
    const url = buildTextageUrl("abc?1=x", 2);
    expect(url).toBe("https://textage.cc/score/abc?2=x");
  });

  it("ticketIdがあるときはRサフィックスが付与されること", () => {
    const url = buildTextageUrl("abc?1=x", 1, "42");
    expect(url).toBe("https://textage.cc/score/abc?1=xR04201234567");
  });

  it("未知の難易度のときbuildChartViewerUrlはnullを返すこと", () => {
    expect(buildChartViewerUrl("abc.html", "BEGINNER")).toBeNull();
  });

  it("既知の難易度のときChartViewerのURLを構築すること", () => {
    expect(buildChartViewerUrl("abc.html", "ANOTHER")).toBe(
      "https://textage-chart-viewer.vercel.app/chart/abc/a",
    );
  });
});

describe("patternUtils", () => {
  it("1234567はnormalと判定されること", () => {
    expect(getPatternBadge("1234567")).toBe("normal");
  });

  it("7654321はmirrorと判定されること", () => {
    expect(getPatternBadge("7654321")).toBe("mirror");
  });

  it("normalの回転パターンはr-ranと判定されること", () => {
    expect(getPatternBadge("2345671")).toBe("r-ran");
  });

  it("それ以外はnullを返すこと", () => {
    expect(getPatternBadge("7162534")).toBeNull();
  });

  it("buildTextageUrlはtextageがない場合nullを返すこと", () => {
    expect(
      buildPatternTextageUrl(
        { textage: null } as never,
        1,
        "1234567",
      ),
    ).toBeNull();
  });
});

describe("formatRankingRate", () => {
  it("notes指定時はexScoreから%表記を計算すること", () => {
    expect(formatRankingRate({ exScore: 1800, bpi: null }, 1000)).toBe(
      "90.0%",
    );
  });

  it("notes未指定時はbpiをそのまま小数第1位で表示すること", () => {
    expect(formatRankingRate({ exScore: null, bpi: 30.456 })).toBe("30.5");
  });

  it("値がない場合は'-'を返すこと", () => {
    expect(formatRankingRate({ exScore: null, bpi: null })).toBe("-");
  });
});

describe("hasBpiData", () => {
  it("bpiフィールドを持つ場合trueを返すこと", () => {
    expect(hasBpiData({ bpi: 30 } as SongWithScore)).toBe(true);
  });

  it("bpiフィールドを持たない場合falseを返すこと", () => {
    expect(hasBpiData({} as SongWithScore)).toBe(false);
  });
});

describe("songListFilter", () => {
  const song = (overrides: Partial<SongListItem> = {}): SongListItem =>
    ({
      songId: 1,
      title: "冥",
      notes: 1000,
      bpm: "150-200",
      difficulty: "ANOTHER",
      difficultyLevel: 12,
      ...overrides,
    }) as SongListItem;

  it("getBpmNumはソフラン表記の最大値を返すこと", () => {
    expect(getBpmNum("150-200")).toBe(200);
  });

  it("getBpmNumは数値化できない場合0を返すこと", () => {
    expect(getBpmNum("")).toBe(0);
  });

  it("getSortValueはtitle/notes/bpmキーに対応すること", () => {
    const s = song();
    expect(getSortValue(s, "title")).toBe("冥");
    expect(getSortValue(s, "notes")).toBe(1000);
    expect(getSortValue(s, "bpm")).toBe(200);
  });

  it("filterAndSortSongsは検索・レベル・難易度で絞り込み、指定キーでソートすること", () => {
    const songs = [
      song({ songId: 1, title: "A", notes: 100 }),
      song({ songId: 2, title: "B", notes: 300 }),
      song({ songId: 3, title: "C", notes: 200 }),
    ];

    const result = filterAndSortSongs(
      songs,
      "",
      new Set(),
      new Set(),
      "notes",
      "asc",
    );

    expect(result.map((s) => s.title)).toEqual(["A", "C", "B"]);
  });

  it("filterAndSortSongsは検索語でタイトルを絞り込むこと", () => {
    const songs = [song({ title: "冥" }), song({ title: "冥京" })];
    const result = filterAndSortSongs(
      songs,
      "冥京",
      new Set(),
      new Set(),
      "title",
      "asc",
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("冥京");
  });
});
