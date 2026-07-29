import { describe, it, expect } from "vitest";
import { parseDakenCounterCsv } from "@/utils/csv/adapters/daken_counter";
import { parseRefluxTsv } from "@/utils/csv/adapters/reflux";
import { parseRizaltoCsv } from "@/utils/csv/adapters/result_techo";
import { correctTitle } from "@/utils/csv/correct-title";

describe("parseDakenCounterCsv", () => {
  const header =
    "LV,Title,mode,Lamp,Score,(rate),BP,Opt(best score),Opt(min bp),Last Played";

  it("正常な行をANOTHER難易度としてパースできること", () => {
    const csv = `${header}\n12,冥,SPA,H-CLEAR,2000,80.00,15,,,2025-01-01 12:00:00`;
    const rows = parseDakenCounterCsv(csv);
    expect(rows).toEqual([
      {
        title: "冥",
        difficulty: "ANOTHER",
        exScore: 2000,
        clearState: "HARD CLEAR",
        missCount: 15,
        lastPlayed: "2025-01-01 12:00:00",
      },
    ]);
  });

  it("NO PLAYの行はスキップされること", () => {
    const csv = `${header}\n12,冥,SPA,NO PLAY,0,,,,,`;
    expect(parseDakenCounterCsv(csv)).toEqual([]);
  });

  it("未知のmode(DPなど)の行はスキップされること", () => {
    const csv = `${header}\n12,冥,DPA,H-CLEAR,2000,,15,,,`;
    expect(parseDakenCounterCsv(csv)).toEqual([]);
  });

  it("BPが '?' や '---' のときmissCountはnullになること", () => {
    const csv = `${header}\n12,冥,SPA,CLEAR,2000,,?,,,`;
    expect(parseDakenCounterCsv(csv)[0].missCount).toBeNull();
  });

  it("1970-01-01始まりの日付はlastPlayedがnullになること", () => {
    const csv = `${header}\n12,冥,SPA,CLEAR,2000,,10,,,1970-01-01 00:00:00`;
    expect(parseDakenCounterCsv(csv)[0].lastPlayed).toBeNull();
  });

  it("列数が不揃いなCSVの場合はエラーを投げること", () => {
    expect(() => parseDakenCounterCsv("a,b\n1,2,3")).toThrow();
  });
});

describe("parseRefluxTsv", () => {
  const buildHeader = () =>
    [
      "title",
      "SPA Lamp",
      "SPA EX Score",
      "SPA Miss Count",
      "SPH Lamp",
      "SPH EX Score",
      "SPH Miss Count",
    ].join("\t");

  it("複数難易度の行を正しくパースできること", () => {
    const tsv = [
      buildHeader(),
      ["冥", "HC", "2000", "5", "FC", "1800", "0"].join("\t"),
    ].join("\n");

    const rows = parseRefluxTsv(tsv);
    expect(rows).toEqual([
      {
        title: "冥",
        difficulty: "HYPER",
        exScore: 1800,
        clearState: "FULLCOMBO CLEAR",
        missCount: 0,
        lastPlayed: null,
      },
      {
        title: "冥",
        difficulty: "ANOTHER",
        exScore: 2000,
        clearState: "HARD CLEAR",
        missCount: 5,
        lastPlayed: null,
      },
    ]);
  });

  it("NPの難易度はスキップされること", () => {
    const tsv = [
      buildHeader(),
      ["冥", "NP", "0", "", "FC", "1800", "0"].join("\t"),
    ].join("\n");
    const rows = parseRefluxTsv(tsv);
    expect(rows).toHaveLength(1);
    expect(rows[0].difficulty).toBe("HYPER");
  });

  it("title列が見つからない場合はエラーを投げること", () => {
    expect(() => parseRefluxTsv("foo\tbar\nbaz\tqux")).toThrow();
  });

  it("ヘッダーのみ(データ行なし)の場合は空配列を返すこと", () => {
    expect(parseRefluxTsv(buildHeader())).toEqual([]);
  });

  it("タイトルの表記揺れがcorrectTitleで補正されること", () => {
    const tsv = [
      buildHeader(),
      ["100% minimoo-G", "HC", "2000", "5", "", "", ""].join("\t"),
    ].join("\n");
    expect(parseRefluxTsv(tsv)[0].title).toBe("100％ minimoo-G");
  });
});

describe("parseRizaltoCsv", () => {
  const header = "曲名,難易度,クリアタイプ,スコア,ミスカウント,最終プレイ日時";

  it("正常な行をパースし日付フォーマットを変換できること", () => {
    const csv = `${header}\n冥,ANOTHER,H-CLEAR,2000,15,20250809-211322`;
    const rows = parseRizaltoCsv(csv);
    expect(rows).toEqual([
      {
        title: "冥",
        difficulty: "ANOTHER",
        exScore: 2000,
        clearState: "HARD CLEAR",
        missCount: 15,
        lastPlayed: "2025-08-09 21:13:22",
      },
    ]);
  });

  it("NO PLAYの行はスキップされること", () => {
    const csv = `${header}\n冥,ANOTHER,NO PLAY,0,,`;
    expect(parseRizaltoCsv(csv)).toEqual([]);
  });

  it("ミスカウントが'---'のときnullになること", () => {
    const csv = `${header}\n冥,ANOTHER,CLEAR,2000,---,`;
    expect(parseRizaltoCsv(csv)[0].missCount).toBeNull();
  });

  it("不正な日付形式のときlastPlayedはnullになること", () => {
    const csv = `${header}\n冥,ANOTHER,CLEAR,2000,0,invalid-date`;
    expect(parseRizaltoCsv(csv)[0].lastPlayed).toBeNull();
  });
});

describe("correctTitle", () => {
  it("補正マップに存在する表記を正式表記に変換すること", () => {
    expect(correctTitle("100% minimoo-G")).toBe("100％ minimoo-G");
  });

  it("補正マップに存在しない表記はそのまま返すこと", () => {
    expect(correctTitle("未知の曲名タイトル")).toBe("未知の曲名タイトル");
  });
});
