import { describe, expect, it } from "vitest";
import { summarizeByArea } from "@/components/partials/features/TopRankers/summary";
import { normalizeIidxId } from "@/lib/subhandlers/topRankers/iidxId";
import { getTopRankerAreaName } from "@/constants/iidx/topRankerAreas";
import { decodeTopRankerParam, encodeTopRankerParam } from "@/hooks/analytics/topRankerParam";
import { decodeTarget, encodeTarget } from "@/hooks/analytics/targetCodec";

describe("summarizeByArea", () => {
  it("エリアごとに累計と最多バージョンを求め、累計の多い順に並べる", () => {
    const rows = summarizeByArea([
      { version: "32", areaId: 27, difficulty: "ANOTHER", difficultyLevel: 12, count: 3 },
      { version: "33", areaId: 27, difficulty: "ANOTHER", difficultyLevel: 12, count: 6 },
      { version: "33", areaId: 27, difficulty: "HYPER", difficultyLevel: 11, count: 4 },
      { version: "33", areaId: 13, difficulty: "NORMAL", difficultyLevel: 7, count: 20 },
    ]);
    expect(rows.map((r) => [r.areaId, r.total, r.bestVersion, r.bestCount])).toEqual([
      [13, 20, "33", 20],
      [27, 13, "33", 10],
    ]);
    expect(rows[1].byVersion).toEqual({ "32": 3, "33": 10 });
  });

  it("レベル別・難易度別の内訳を全体とバージョン別に集計する", () => {
    const [row] = summarizeByArea([
      { version: "32", areaId: 27, difficulty: "ANOTHER", difficultyLevel: 12, count: 3 },
      { version: "33", areaId: 27, difficulty: "ANOTHER", difficultyLevel: 12, count: 6 },
      { version: "33", areaId: 27, difficulty: "HYPER", difficultyLevel: 11, count: 4 },
    ]);
    expect(row.breakdown.byLevel).toEqual({ 11: 4, 12: 9 });
    expect(row.breakdown.byDifficulty).toEqual({ ANOTHER: 9, HYPER: 4 });
    expect(row.breakdownByVersion["33"].byLevel).toEqual({ 11: 4, 12: 6 });
    expect(row.breakdownByVersion["32"].byDifficulty).toEqual({ ANOTHER: 3 });
  });

  it("空配列は空配列を返す", () => {
    expect(summarizeByArea([])).toEqual([]);
  });
});

describe("normalizeIidxId", () => {
  it("ハイフンを除去し、未設定・空は null にする", () => {
    expect(normalizeIidxId("0831-9886")).toBe("08319886");
    expect(normalizeIidxId("08319886")).toBe("08319886");
    expect(normalizeIidxId("")).toBeNull();
    expect(normalizeIidxId(null)).toBeNull();
  });
});

describe("県別1位ターゲットのparam", () => {
  it("encodeTarget/decodeTargetを通しても版とエリアが復元できる", () => {
    const target = {
      kind: "top-ranker" as const,
      param: encodeTopRankerParam("33", 27),
      label: "県別1位 33 Sparkle Shower 大阪府",
    };
    const decoded = decodeTarget(encodeTarget(target));
    expect(decoded).toEqual(target);
    expect(decodeTopRankerParam(decoded?.param)).toEqual({ version: "33", areaId: 27 });
  });

  it("不正なparamではareaIdがnullになる", () => {
    expect(decodeTopRankerParam(undefined)).toEqual({ version: "", areaId: null });
    expect(decodeTopRankerParam("33")).toEqual({ version: "33", areaId: null });
  });
});

describe("getTopRankerAreaName", () => {
  it("pref_id から全国・都道府県・海外の名称を引く", () => {
    expect(getTopRankerAreaName(0)).toBe("全国");
    expect(getTopRankerAreaName(3)).toBe("岩手県");
    expect(getTopRankerAreaName(27)).toBe("大阪府");
    expect(getTopRankerAreaName(47)).toBe("沖縄県");
    expect(getTopRankerAreaName(48)).toBe("香港");
    expect(getTopRankerAreaName(59)).toBe("海外");
  });
});
