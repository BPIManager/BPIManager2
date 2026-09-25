/**
 * BPI V2（分布ベース再定義）のグローバルモデル定数。
 *
 * BPIM2-AutomatedDefinitionCalculatorのアリーナクロール結果とbpim2登録
 * ユーザーの実スコアを統合した母集団でALS推定した結果（生成日時
 * 2026-09-09、対象バージョン33、playerCount=5113人、
 * minSongsPerPlayer=10）から得た値をハードコードしている。
 *
 * z0はアリーナA帯(a1〜a5)在籍者の潜在能力a_iの中央値(全曲共通)。
 * zRef/z100Iqrはgamma補正用。residualRmseはALS残差の標準偏差(t単位)で
 * 潜在スキルa_iの縮小推定の事前分散との重み付けに使う。coefMedian
 * は per-song カーブ指数`coef`未収録曲のフォールバック。rankCurveは実
 * アリーナ順位×a_iの経験カーブ。arenaPopulationSizeはrankCurveの
 * パーセンタイルを絶対順位に変換する基準人数。
 *
 * 曲ごとのmu/sigma/residualVar/coefは本番同様`songDef`(DB)から読む
 * （`BpiCalculator.toChart`参照）。再生成する場合は
 * `scripts/generate-new-bpi-params.ts`の出力からここの値を更新する。
 */
export const NEW_BPI_Z0 = -0.19383932671707751;
export const NEW_BPI_Z100 = 6.516395340703802;
export const NEW_BPI_Z_REF = 1.9481138704797247;
export const NEW_BPI_RESIDUAL_RMSE = 0.3012;
export const NEW_BPI_Z100_IQR = 1.1916;
export const NEW_BPI_COEF_MEDIAN = 0.949;
export const NEW_BPI_ARENA_POPULATION_SIZE = 4867;

export const NEW_BPI_RANK_CURVE: { percentile: number; a: number }[] = [
  { percentile: 0.00873, a: 2.6978 },
  { percentile: 0.02582, a: 1.9399 },
  { percentile: 0.04183, a: 1.5948 },
  { percentile: 0.05791, a: 1.3395 },
  { percentile: 0.07426, a: 1.0485 },
  { percentile: 0.09091, a: 0.9967 },
  { percentile: 0.10736, a: 0.8274 },
  { percentile: 0.12333, a: 0.674 },
  { percentile: 0.13927, a: 0.6182 },
  { percentile: 0.15541, a: 0.569 },
  { percentile: 0.17273, a: 0.5675 },
  { percentile: 0.19055, a: 0.5675 },
  { percentile: 0.2095, a: 0.4857 },
  { percentile: 0.2282, a: 0.3212 },
  { percentile: 0.24673, a: 0.0643 },
  { percentile: 0.2635, a: -0.0158 },
  { percentile: 0.27991, a: -0.0158 },
  { percentile: 0.29627, a: -0.0633 },
  { percentile: 0.31283, a: -0.0633 },
  { percentile: 0.3298, a: -0.0633 },
  { percentile: 0.34782, a: -0.0633 },
  { percentile: 0.3668, a: -0.0633 },
  { percentile: 0.38664, a: -0.1149 },
  { percentile: 0.40659, a: -0.1677 },
  { percentile: 0.42725, a: -0.3396 },
  { percentile: 0.4498, a: -0.5051 },
  { percentile: 0.45936, a: -0.7482 },
  { percentile: 0.46609, a: -0.7482 },
  { percentile: 0.47391, a: -0.7482 },
  { percentile: 0.48164, a: -0.7482 },
  { percentile: 0.489, a: -0.7935 },
  { percentile: 0.4962, a: -0.7964 },
  { percentile: 0.50382, a: -0.7964 },
  { percentile: 0.51731, a: -0.7964 },
  { percentile: 0.53036, a: -0.7964 },
  { percentile: 0.5412, a: -0.7964 },
  { percentile: 0.56116, a: -0.7964 },
  { percentile: 0.58753, a: -0.7964 },
  { percentile: 0.61509, a: -0.7964 },
  { percentile: 0.64333, a: -0.7964 },
  { percentile: 0.67288, a: -0.7964 },
  { percentile: 0.70517, a: -0.7964 },
  { percentile: 0.73774, a: -0.7964 },
  { percentile: 0.77033, a: -0.8085 },
  { percentile: 0.80311, a: -0.8268 },
  { percentile: 0.83417, a: -0.8831 },
  { percentile: 0.8662, a: -0.8831 },
  { percentile: 0.89953, a: -0.8831 },
  { percentile: 0.9358, a: -0.8831 },
  { percentile: 0.97033, a: -0.9192 },
];
