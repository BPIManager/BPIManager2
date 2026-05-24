/** アリーナ平均スコアデータの1楽曲分 */
export interface ArenaAverageData {
  title: string;
  difficulty: string;
  notes: number;
  maxScore: number;
  /** レーダーカテゴリ（NOTES / CHORD / PEAK / CHARGE / SCRATCH / SOFLAN） */
  radarCategory?: string;
  /** アリーナランク（`"A1"` など）をキーとした平均スコア情報 */
  averages: Record<
    string,
    {
      /** 平均EXスコア */
      avgExScore: number;
      /** スコアレート */
      rate: number;
      /** 集計件数 */
      count: number;
      /** 平均BPI */
      avgBpi?: number;
    }
  >;
}
