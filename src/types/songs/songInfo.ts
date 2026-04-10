export interface SongListItem {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  bpm: string;
  textage: string;
  wrScore: number | null;
  kaidenAvg: number | null;
  // songAttributes (Profile 相対評価: 0-100)
  p_scratch: number | null;
  p_soflan: number | null;
  p_cn: number | null;
  p_chord: number | null;
  p_intensity: number | null;
  p_udeoshi: number | null;
  p_delay: number | null;
  p_scratch_complex: number | null;
  p_tateren: number | null;
  p_trill_denim: number | null;
  p_peak: number | null;
  // songAttributes (Global 難易度間比較: 0-100)
  g_scratch: number | null;
  g_soflan: number | null;
  g_cn: number | null;
  g_chord: number | null;
  g_intensity: number | null;
  g_udeoshi: number | null;
  g_delay: number | null;
  g_scratch_complex: number | null;
  g_tateren: number | null;
  g_trill_denim: number | null;
  g_peak: number | null;
}

export type SongListResponse = SongListItem[];

export interface SimilarSongItem {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  bpm: string;
  p_scratch: number | null;
  p_soflan: number | null;
  p_cn: number | null;
  p_chord: number | null;
  p_intensity: number | null;
  p_udeoshi: number | null;
  p_delay: number | null;
  p_scratch_complex: number | null;
  p_tateren: number | null;
  p_trill_denim: number | null;
  p_peak: number | null;
  g_scratch: number | null;
  g_soflan: number | null;
  g_cn: number | null;
  g_chord: number | null;
  g_intensity: number | null;
  g_udeoshi: number | null;
  g_delay: number | null;
  g_scratch_complex: number | null;
  g_tateren: number | null;
  g_trill_denim: number | null;
  g_peak: number | null;
  distance: number;
}

export type SimilarSongsResponse = SimilarSongItem[];
