/** ランク分布の1区間 */
export interface RankDistItem {
  /** 区間ラベル（例: `"AAA"`, `"AA"`, `"0〜10"` など） */
  label: string;
  /** 該当楽曲数 */
  count: number;
}
