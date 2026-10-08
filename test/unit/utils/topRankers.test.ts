import { describe, expect, it } from "vitest";
import { summarizeByArea } from "@/components/partials/features/TopRankers/summary";
import { normalizeIidxId } from "@/lib/subhandlers/topRankers/iidxId";
import { getTopRankerAreaName } from "@/constants/iidx/topRankerAreas";
import { decodeTopRankerParam, encodeTopRankerParam } from "@/hooks/analytics/topRankerParam";
import { decodeTarget, encodeTarget } from "@/hooks/analytics/targetCodec";

describe("summarizeByArea", () => {
  it("エリアごとに累計と最多バージョンを求め、累計の多い順に並べる", () => {
    const rows = summarizeByArea([
      { version: "32", areaId: 27, count: 3 },
      { version: "33", areaId: 27, count: 10 },
      { version: "33", areaId: 13, count: 20 },
    ]);
    expect(rows).toEqual([
      { areaId: 13, total: 20, bestVersion: "33", bestCount: 20, byVersion: { "33": 20 } },
      {
        areaId: 27,
        total: 13,
        bestVersion: "33",
        bestCount: 10,
        byVersion: { "32": 3, "33": 10 },
      },
    ]);
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
