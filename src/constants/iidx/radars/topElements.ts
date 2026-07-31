import type { RadarCategory } from "@/types/stats/radar";

type TopElementEntry = { title: string; difficulty: string; top: RadarCategory };

// eslint-disable-next-line @typescript-eslint/no-require-imports
const topElements: TopElementEntry[] = require("./topElements.json");
export default topElements;

/**
 * `title___difficulty` をキーに楽曲のレーダーカテゴリを引く共通Map。
 * 各モジュールが独自に再構築していたものをここに一本化している。
 */
export const topElementMap: Map<string, RadarCategory> = new Map(
  topElements.map((e) => [`${e.title}___${e.difficulty}`, e.top]),
);

/**
 * レーダーカテゴリ別に楽曲をグルーピングした共通Map。
 * カテゴリごとに`topElements`全体をfilterする代わりにこちらを参照する。
 */
export const topElementsByCategory: Map<RadarCategory, TopElementEntry[]> =
  (() => {
    const map = new Map<RadarCategory, TopElementEntry[]>();
    for (const e of topElements) {
      const list = map.get(e.top);
      if (list) {
        list.push(e);
      } else {
        map.set(e.top, [e]);
      }
    }
    return map;
  })();
