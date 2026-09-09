# 0010: 潜在スキルa_iの縮小推定を単一σε²から曲別の逆分散加重へ

- **ステータス**: 採用
- **記録日**: 2026-09-09
- **対応issue**: #370（epic #367）

## 背景

新方式BPIの潜在スキル`a_i`縮小推定（決定記録 [0006](0006-new-bpi-latent-skill-shrinkage.md)）と未プレイ曲埋め（`docs/bpi-math.md` §7.5）は、ALS残差の分散を**全曲共通の単一スカラー** `residualRmse²`（`NEW_BPI_RESIDUAL_RMSE`）で扱っていた。

```
num = Σ_j σ_j(t_ij − μ_j)
den = Σ_j σ_j²
a_shrunk = num / (den + residualRmse²)
w (未プレイ埋め) = den / (den + residualRmse²)
```

実際の残差分散は曲ごとに異なる（`§7.4` 脚注が「弁別力の低い曲ほど `z_ij` のばらつきが大きい」と認識）。単一値は「ノイズの大きい曲」と「安定して出る曲」を同列に扱う。

## 検討した選択肢

| 案 | 概要 |
|---|---|
| A: 単一 σε²（現状維持） | 実装最小。不等分散を無視 |
| B: 曲ごと σε,j² の逆分散加重（GLS） | `num* = Σ σ_j(t−μ)/σε,j²`、`info = Σ σ_j²/σε,j²`（精度単位）、`a_shrunk = num*/(info+1)`、`w = info/(info+1)`。σε,j² が全曲一定なら A と厳密に一致する一般化 |
| C: B + 実力帯依存 σε,ij² = σε,j²·g(a_i) | 強者ほど残差小をモデル化。重みが未知の `a_i` に依存し反復が要る |

## 実測（issue #370、`scripts/_new-bpi-holdout.ts`）

shipped の `μ_j, σ_j` を固定し、shrinkage 無しの `a_hat` で曲ごとの残差分散を算出（現行 vintage 母集団 5,809人、1,298曲）:

- `σε,j`（=√、ν=30 で global へ縮小）: min 0.151 / p10 0.233 / **median 0.293** / p90 0.379 / max 0.534。median は global `0.2936` に一致。p10→p90 で分散 σε,j² は約 2.7× ばらつく（ν=10/30/100 で分布ほぼ不変＝各曲 300〜5,000 観測で σε,j² はよく決まる）
- `σε,j²` は **どの構造量とも無相関**: vs σ_j `r=0.01` / μ_j `r=0.05` / notes `r=−0.16` / 観測数 `r=−0.25` / |残差SVD第1因子（#371-A）| `r=0.06`
- 影響（単一σε² → 曲別逆分散加重、保有曲 30〜500 の 3,269 プレイヤー）: `Δa_shrunk` mean −0.001 / median −0.003 / p10・p90 ∓0.042 / |max| 0.25。`Δw` は mean +0.0005（ほぼ不動）。→ 総合BPI の変化は大多数で **1点未満**

## 結論

**B案を採用する。**

- 統計的に正しい一般化であり、`σε,j²` が全曲一定なら現行式と厳密に一致する（`residualVar` 未収録曲は `residualRmse²` にフォールバック）ため、退行リスクが無い。
- 実利益は限界的（総合BPI <1pt が大多数）だが、**自由パラメータを増やさず**（`σε,j²` は実測、縮小の擬似カウント `ν=30` は感度が無い）にモデルの前提を1つ正す、リファインとして取り込む。
- `σε,j²` は無構造なので #371-A のスケール残差は吸収しない。それは別問題（→ #371、当面見送り）。
- C案は B が限界的である以上、優先度なし。`a_i` デシル別の残差傾き測定も見送り。

## 実装

- `scripts/_new-bpi-holdout.ts --write` が shipped `songParams.json` の各 `songs[sid]` に `residualVar`（t単位、ν=30 で global へ縮小、4桁丸め）を**追記**する。`mu`/`sigma`/`z0`/`z100Iqr`/`zRef`/`residualRmse`/`rankCurve` 等の既存値は一切変更しない
- `src/constants/iidx/newBpi/songParams.ts`: `NewBpiSongParam` に `residualVar?: number` を追加
- `src/lib/bpi/newBpi.ts`: `estimateLatentSkillWithConfidence` を逆分散加重に変更（`a = num/(info+1)`、`info` は精度単位）、`predictUnplayedBpi` の重みを `w = info/(info+1)` に変更
- `residualRmse`（global）は `residualVar` 未収録曲のフォールバックとして残す
- 挙動確認: `test/unit/logic/newBpi.test.ts` は定性的なテスト（単調性・境界）のため、この一般化で通過する
