/**
 * `songAttributes`（プロフィール属性/グローバル属性）の全26カラムを、
 * `songAttributes as a` エイリアス経由で参照するための共通SELECTリスト。
 *
 * 呼び出し側は `.leftJoin("songAttributes as a", ...)`（または `innerJoin`）
 * した上で `.select([...SONG_ATTRIBUTE_SELECT_COLUMNS])` を使う。
 */
export const SONG_ATTRIBUTE_SELECT_COLUMNS = [
  "a.p_scratch",
  "a.p_soflan",
  "a.p_cn",
  "a.p_chord",
  "a.p_intensity",
  "a.p_udeoshi",
  "a.p_delay",
  "a.p_scratch_complex",
  "a.p_tateren",
  "a.p_trill_denim",
  "a.p_peak",
  "a.g_scratch",
  "a.g_soflan",
  "a.g_cn",
  "a.g_chord",
  "a.g_intensity",
  "a.g_udeoshi",
  "a.g_delay",
  "a.g_scratch_complex",
  "a.g_tateren",
  "a.g_trill_denim",
  "a.g_peak",
] as const;
