import { describe, it, expect } from "vitest";
import {
  mergeRankingTabs,
  pickBehindSongs,
  toTabSettings,
} from "@/lib/dashboard/rankingTabs";
import type { SavedComparison } from "@/types/analytics/saved";

const saved = (id: number, targetCount = 1): SavedComparison => ({
  id,
  name: `c${id}`,
  targets: Array.from({ length: targetCount }, (_, i) => ({
    kind: "wr" as const,
    label: `t${i}`,
    accessible: true,
  })),
  createdAt: "",
  updatedAt: "",
});

describe("mergeRankingTabs", () => {
  it("設定が無ければ組み込み3タブを既定順・表示で返し、保存済み比較は非表示で末尾に足す", () => {
    const tabs = mergeRankingTabs([], [saved(1)]);
    expect(tabs.map((t) => [t.key, t.visible])).toEqual([
      ["weapons", true],
      ["potential", true],
      ["nearLose", true],
      ["saved:1", false],
    ]);
  });

  it("設定の並び・表示を反映する", () => {
    const tabs = mergeRankingTabs(
      [
        { key: "saved:1", visible: true, targetIndex: 1 },
        { key: "nearLose", visible: false },
        { key: "weapons", visible: true },
      ],
      [saved(1, 2)],
    );
    expect(tabs.map((t) => t.key)).toEqual(["saved:1", "nearLose", "weapons", "potential"]);
    expect(tabs[0]).toMatchObject({ visible: true, targetIndex: 1 });
    expect(tabs[1].visible).toBe(false);
  });

  it("削除済みの保存済み比較・不明なキー・重複は捨てる", () => {
    const tabs = mergeRankingTabs(
      [
        { key: "saved:99", visible: true },
        { key: "bogus", visible: true },
        { key: "weapons", visible: true },
        { key: "weapons", visible: false },
      ],
      [],
    );
    expect(tabs.map((t) => t.key)).toEqual(["weapons", "potential", "nearLose"]);
    expect(tabs[0].visible).toBe(true);
  });

  it("ターゲット数を超える targetIndex は範囲内に丸める", () => {
    const tabs = mergeRankingTabs([{ key: "saved:1", visible: true, targetIndex: 4 }], [saved(1, 2)]);
    expect(tabs[0].targetIndex).toBe(1);
  });
});

describe("toTabSettings", () => {
  it("保存済み比較タブにだけ targetIndex を付ける", () => {
    const settings = toTabSettings(mergeRankingTabs([], [saved(1)]));
    expect(settings.find((s) => s.key === "weapons")).toEqual({ key: "weapons", visible: true });
    expect(settings.find((s) => s.key === "saved:1")).toEqual({
      key: "saved:1",
      visible: false,
      targetIndex: 0,
    });
  });
});

describe("pickBehindSongs", () => {
  it("負けている譜面だけを差の小さい順に返す", () => {
    const result = pickBehindSongs([
      { id: 1, exDiff: -30 },
      { id: 2, exDiff: 5 },
      { id: 3, exDiff: -2 },
      { id: 4, exDiff: undefined },
      { id: 5, exDiff: 0 },
    ]);
    expect(result.map((r) => [r.id, r.remaining])).toEqual([
      [3, 2],
      [1, 30],
    ]);
  });
});
