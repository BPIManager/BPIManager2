/**
 * issue #299〜304（単曲BPIの分布ベース再定義）検証用のパラメータ。
 *
 * `mu`/`sigma` はDBスキーマ変更を避けるため、`songDef` にカラムを追加せず
 * このJSON経由でのみ供給する（#299以降が未実装の検証段階のため）。
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
  songs: Record<string, { mu: number; sigma: number }>;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const newBpiParams: NewBpiSongParamsFile = require("./songParams.json");
export default newBpiParams;

export type NewBpiSongParam = { mu: number; sigma: number };

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
