/** ランク分布の1区間 */
export interface RankDistItem {
  /** 区間ラベル（例: `"AAA"`, `"AA"`, `"0〜10"` など） */
  label: string;
  /** 該当楽曲数 */
  count: number;
}

/** BPM帯別一覧に含まれる楽曲エントリ */
export interface BpmBandSongEntry {
  title: string;
  difficulty: string;
  bpi: number;
  exScore: number | null;
  notes: number | null;
}

/** BPM帯別総合BPIの1区間 */
export interface BpmBandBpiItem {
  /** BPM帯ラベル（例: `"200~"`, `"180~200"`, `"Soflan"` など） */
  label: string;
  /** 総合 BPI */
  totalBpi: number;
  /** BPM帯に含まれる楽曲リスト */
  songs?: BpmBandSongEntry[];
}
