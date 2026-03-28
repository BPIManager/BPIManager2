/** アリーナ平均スコアデータの1楽曲分 */
export interface ArenaAverageData {
  title: string;
  difficulty: string;
  notes: number;
  maxScore: number;
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
    }
  >;
}
