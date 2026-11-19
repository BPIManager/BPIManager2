import { describe, it, expect } from "vitest";
import { parseDakenCounterCsv } from "@/utils/csv/adapters/daken_counter";
import { parseRefluxTsv } from "@/utils/csv/adapters/reflux";
import { parseRizaltoCsv } from "@/utils/csv/adapters/result_techo";
import { parseInfinitasCsv } from "@/utils/csv/adapters/infinitas_csv";
import { detectCsvType, validateCsvTypeForVersion } from "@/utils/csv/detect";
import infinitasCorrections from "@/utils/csv/infinitas-title-corrections.json";
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

describe("parseInfinitasCsv / detectCsvType", () => {
  const header =
    "バージョン,タイトル,アーティスト,BEGINNER スコア,BEGINNER 最終スコア更新時刻,BEGINNER ミスカウント,BEGINNER クリアタイプ,BEGINNER プレー回数,BEGINNER 最終プレー日時,NORMAL スコア,NORMAL 最終スコア更新時刻,NORMAL ミスカウント,NORMAL クリアタイプ,NORMAL プレー回数,NORMAL 最終プレー日時,HYPER スコア,HYPER 最終スコア更新時刻,HYPER ミスカウント,HYPER クリアタイプ,HYPER プレー回数,HYPER 最終プレー日時,ANOTHER スコア,ANOTHER 最終スコア更新時刻,ANOTHER ミスカウント,ANOTHER クリアタイプ,ANOTHER プレー回数,ANOTHER 最終プレー日時,LEGGENDARIA スコア,LEGGENDARIA 最終スコア更新時刻,LEGGENDARIA ミスカウント,LEGGENDARIA クリアタイプ,LEGGENDARIA プレー回数,LEGGENDARIA 最終プレー日時,";
  // 実データは行末カンマ無し（ヘッダより1列少ない）
  const row =
    "1st&substream,22DUNK,SLAKE,0,---,---,NO PLAY,0,---,0,---,---,NO PLAY,0,---,0,---,---,NO PLAY,0,---,646,2022-07-13 18:56,0,FULLCOMBO CLEAR,3,2022-07-13 18:56,0,---,---,NO PLAY,0,---";

  it("公式CSVではなくINFINITAS CSVとして判別されること", () => {
    expect(detectCsvType(`${header}\n${row}`)).toBe("infinitas_csv");
  });

  it("プレー済みの難易度のみ変換され、列数不一致でも失敗しないこと", () => {
    expect(parseInfinitasCsv(`${header}\n${row}`)).toEqual([
      {
        title: "22DUNK",
        difficulty: "ANOTHER",
        exScore: 646,
        clearState: "FULLCOMBO CLEAR",
        missCount: 0,
        lastPlayed: "2022-07-13 18:56",
      },
    ]);
  });

  it("INFINITASバージョンでのみ受け付けられること", () => {
    expect(validateCsvTypeForVersion("infinitas_csv", "INF")).toBeNull();
    expect(validateCsvTypeForVersion("infinitas_csv", "34")).not.toBeNull();
  });
});

describe("parseInfinitasCsv（韓国語版）", () => {
  const diffs = ["BEGINNER", "NORMAL", "HYPER", "ANOTHER", "LEGGENDARIA"];
  const header = `버전,타이틀,아티스트,${diffs
    .map(
      (d) =>
        `${d} 스코어,${d} 최종 스코어 갱신 일시,${d} 미스 카운트,${d} 클리어 타입,${d} 플레이 횟수,${d} 최종 플레이 일자`,
    )
    .join(",")},`;
  const row =
    "1st&substream,22DUNK,SLAKE,0,---,---,NO PLAY,0,---,0,---,---,NO PLAY,0,---,0,---,---,NO PLAY,0,---,646,2022-07-13 18:56,0,FULLCOMBO CLEAR,3,2022-07-13 18:56,0,---,---,NO PLAY,0,---";

  it("INFINITAS CSV として判別されること", () => {
    expect(detectCsvType(`${header}
${row}`)).toBe("infinitas_csv");
  });

  it("日本語版と同じ行へ変換されること", () => {
    expect(parseInfinitasCsv(`${header}
${row}`)).toEqual([
      {
        title: "22DUNK",
        difficulty: "ANOTHER",
        exScore: 646,
        clearState: "FULLCOMBO CLEAR",
        missCount: 0,
        lastPlayed: "2022-07-13 18:56",
      },
    ]);
  });
});

describe("parseInfinitasCsv の曲名補正", () => {
  const header =
    "バージョン,タイトル,アーティスト,BEGINNER スコア,BEGINNER 最終スコア更新時刻,BEGINNER ミスカウント,BEGINNER クリアタイプ,BEGINNER プレー回数,BEGINNER 最終プレー日時,NORMAL スコア,NORMAL 最終スコア更新時刻,NORMAL ミスカウント,NORMAL クリアタイプ,NORMAL プレー回数,NORMAL 最終プレー日時,HYPER スコア,HYPER 最終スコア更新時刻,HYPER ミスカウント,HYPER クリアタイプ,HYPER プレー回数,HYPER 最終プレー日時,ANOTHER スコア,ANOTHER 最終スコア更新時刻,ANOTHER ミスカウント,ANOTHER クリアタイプ,ANOTHER プレー回数,ANOTHER 最終プレー日時,LEGGENDARIA スコア,LEGGENDARIA 最終スコア更新時刻,LEGGENDARIA ミスカウント,LEGGENDARIA クリアタイプ,LEGGENDARIA プレー回数,LEGGENDARIA 最終プレー日時,";
  const tail =
    "0,---,---,NO PLAY,0,---,0,---,---,NO PLAY,0,---,1000,2024-01-01 00:00,1,CLEAR,1,2024-01-01 00:00,0,---,---,NO PLAY,0,---,0,---,---,NO PLAY,0,---";

  it("allSongs の表記へ補正され、末尾の空白は除去されること", () => {
    const csv = [
      header,
      `EMPRESS,You'll say Now!,X,${tail}`,
      `PENDUAL,COLOSSEUM ,X,${tail}`,
      `9th style,LOVE♡SHINE,X,${tail}`,
    ].join("\n");
    expect(parseInfinitasCsv(csv).map((r) => r.title)).toEqual([
      `You'll say "Now!"`,
      "COLOSSEUM",
      "LOVE SHINE",
    ]);
  });
});

describe("infinitas-title-corrections.json", () => {
  const entries = Object.entries(infinitasCorrections as Record<string, string>);

  it("自己対応・連鎖・空文字を含まない1:1の固定対応であること", () => {
    const keys = new Set(entries.map(([k]) => k));
    for (const [from, to] of entries) {
      expect(to).not.toBe("");
      expect(from).not.toBe(to);
      expect(keys.has(to)).toBe(false);
    }
  });

  it("補正先が重複しないこと", () => {
    const targets = entries.map(([, to]) => to);
    expect(new Set(targets).size).toBe(targets.length);
  });
});
