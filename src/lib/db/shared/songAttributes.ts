/**
 * songAttributes の全カラムを as a エイリアス経由で参照する共通 SELECT リスト。
 * 呼び出し側は leftJoin/innerJoin（"songAttributes as a"）した上で select に展開する。
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
