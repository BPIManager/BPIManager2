import { JAPAN_PREFECTURES } from "@/constants/iidx/rankingPrefectures";

/** topranker の集計対象バージョン（eagateで取得できる範囲） */
export const TOP_RANKER_VERSIONS = ["27", "28", "29", "30", "31", "32", "33"] as const;

export const NATIONWIDE_AREA_ID = 0;

const OVERSEAS_AREAS = [
  "香港",
  "韓国",
  "台湾",
  "タイ",
  "インドネシア",
  "シンガポール",
  "フィリピン",
  "マカオ",
  "アメリカ",
  "オーストラリア",
  "ニュージーランド",
  "海外",
] as const;

/** eagateのpref_idとエリア名の対応。0=全国、1〜47=都道府県、48以降=海外 */
export const TOP_RANKER_AREA_NAMES: readonly string[] = [
  "全国",
  ...JAPAN_PREFECTURES.slice(0, 47),
  ...OVERSEAS_AREAS,
];

export const getTopRankerAreaName = (areaId: number): string =>
  TOP_RANKER_AREA_NAMES[areaId] ?? String(areaId);
