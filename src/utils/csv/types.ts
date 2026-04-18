/** parseCSV / アダプタ共通の出力行型 */
export type ParsedCsvRow = {
  title: string;
  difficulty: string;
  exScore: number;
  clearState: string;
  missCount: number | null;
  lastPlayed: string | null;
};
