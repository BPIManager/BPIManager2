/**
 * 楽曲属性マスタ定義。
 *
 * 要素の追加・削除はこのファイルのみを編集すればよい。
 * ただし DB スキーマ (songAttributes テーブル) と
 * Kysely クエリの SELECT リスト (src/lib/db/songs/index.ts) は別途変更が必要。
 */

export interface SongAttributeDef {
  /** DB カラム名・SongListItem / SimilarSongItem のキー (p_*) */
  readonly dbKey: string;
  /** SortKey の値・ソートドロップダウンの value */
  readonly sortKey: string;
  /** レーダーチャート軸ラベル・ATTRIBUTES バー表示ラベル */
  readonly label: string;
  /** ソートドロップダウン表示ラベル */
  readonly sortLabel: string;
}

export const SONG_ATTRIBUTES = [
  { dbKey: "p_scratch", sortKey: "scratch", label: "皿", sortLabel: "皿" },
  {
    dbKey: "p_soflan",
    sortKey: "soflan",
    label: "ソフラン",
    sortLabel: "ソフラン",
  },
  { dbKey: "p_cn", sortKey: "cn", label: "CN", sortLabel: "CN" },
  {
    dbKey: "p_chord",
    sortKey: "chord",
    label: "同時押し",
    sortLabel: "同時押し",
  },
  {
    dbKey: "p_intensity",
    sortKey: "intensity",
    label: "物量",
    sortLabel: "物量",
  },
  {
    dbKey: "p_delay",
    sortKey: "delay",
    label: "ディレイ",
    sortLabel: "ディレイ",
  },
  {
    dbKey: "p_scratch_complex",
    sortKey: "scratch_complex",
    label: "皿複合",
    sortLabel: "皿複合",
  },
  { dbKey: "p_tateren", sortKey: "tateren", label: "縦連", sortLabel: "縦連" },
  {
    dbKey: "p_trill_denim",
    sortKey: "trill_denim",
    label: "トリル/デニム",
    sortLabel: "トリル・デニム",
  },
  {
    dbKey: "p_peak",
    sortKey: "peak",
    label: "ピーク",
    sortLabel: "ピーク",
  },
  {
    dbKey: "p_udeoshi",
    sortKey: "udeoshi",
    label: "腕押し",
    sortLabel: "腕押し",
  },
] as const satisfies readonly SongAttributeDef[];

/** 属性 DB キーのユニオン型 */
export type AttrDbKey = (typeof SONG_ATTRIBUTES)[number]["dbKey"];

/** 属性ソートキーのユニオン型 */
export type AttrSortKey = (typeof SONG_ATTRIBUTES)[number]["sortKey"];

/**
 * 楽曲間比較属性（g_*）。p_* と同じ軸を難易度横断で正規化した値。
 * ラベルは SONG_ATTRIBUTES と共通。
 */
export const SONG_ATTRIBUTES_GLOBAL = [
  { dbKey: "g_scratch", label: "皿" },
  { dbKey: "g_soflan", label: "ソフラン" },
  { dbKey: "g_cn", label: "CN" },
  { dbKey: "g_chord", label: "同時押し" },
  { dbKey: "g_intensity", label: "物量" },
  { dbKey: "g_delay", label: "ディレイ" },
  { dbKey: "g_tateren", label: "縦連" },
  { dbKey: "g_trill_denim", label: "トリル/デニム" },
  { dbKey: "g_peak", label: "ピーク" },
] as const;

export type GlobalAttrDbKey = (typeof SONG_ATTRIBUTES_GLOBAL)[number]["dbKey"];
