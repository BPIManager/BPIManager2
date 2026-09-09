/**
 * 単曲BPIの分布ベース再定義（新方式BPIプレビュー `/new-bpi`）用のパラメータ。
 *
 * `mu`/`sigma` はDBスキーマ変更を避けるため、`songDef` にカラムを追加せず
 * このJSON経由でのみ供給する（本採用前の検証段階のため）。
 * `scripts/generate-new-bpi-params.ts` で
 * BPIM2-AutomatedDefinitionCalculatorのアリーナクロール結果(IIDX ID紐付け)
 * とbpim2自身のスコアを統合した母集団から再生成できる。
 */
type NewBpiSongParamsFile = {
  _comment: string;
  generatedAt: string;
  sourceVersion: string;
  playerCount: number;
  minSongsPerPlayer: number;
  z0: number;
  z100: number;
  zRef: number;
  /** ALS残差の標準偏差(t単位)。潜在スキルa_iの縮小推定(#304)の事前分散との重み付けに使う。 */
  residualRmse: number;
  /** z100(曲ごとのWR位置)分布の四分位範囲。gamma補正の信頼度重み付けに使う。 */
  z100Iqr: number;
  /**
   * 実際のアリーナ順位(パーセンタイル)と潜在能力a_iの経験的な対応表
   * （percentile昇順、aは非増加）。NewBpiCalculator.estimateRankの順位推定に使う。
   */
  rankCurve: { percentile: number; a: number }[];
  /** rankCurveのパーセンタイルを絶対順位に変換する基準人数(z0と同じアリーナA帯在籍者数)。 */
  arenaPopulationSize: number;
  /**
   * `n`は各曲の観測数。`residualVar`は曲ごとのALS残差分散(t単位、決定記録0010)。
   * `residualVar`未収録の曲はa_i縮小推定で`residualRmse²`にフォールバックする。
   */
  songs: Record<
    string,
    { mu: number; sigma: number; n: number; residualVar?: number }
  >;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const newBpiParams: NewBpiSongParamsFile = require("./songParams.json");
export default newBpiParams;

export type NewBpiSongParam = {
  mu: number;
  sigma: number;
  n: number;
  /** 曲ごとのALS残差分散(t単位、決定記録0010)。未収録なら`NEW_BPI_RESIDUAL_RMSE²`。 */
  residualVar?: number;
};

/** `songId` をキーに mu/sigma を引く共通Map。データが無い楽曲は未収録。 */
export const newBpiSongParamMap: Map<number, NewBpiSongParam> = new Map(
  Object.entries(newBpiParams.songs).map(([songId, param]) => [
    Number(songId),
    param,
  ]),
);

export const NEW_BPI_Z0 = newBpiParams.z0;
export const NEW_BPI_Z100 = newBpiParams.z100;
export const NEW_BPI_Z_REF = newBpiParams.zRef;
export const NEW_BPI_RESIDUAL_RMSE = newBpiParams.residualRmse;
export const NEW_BPI_Z100_IQR = newBpiParams.z100Iqr;
export const NEW_BPI_RANK_CURVE = newBpiParams.rankCurve;
export const NEW_BPI_ARENA_POPULATION_SIZE = newBpiParams.arenaPopulationSize;
