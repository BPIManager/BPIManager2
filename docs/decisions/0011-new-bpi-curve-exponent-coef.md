# 0011: 単曲BPIのカーブ指数に現行定義の per-song `coef` を掛ける

- **ステータス**: 採用（検証中。決定記録 [0005](0005-new-bpi-distribution-model.md) §3 の `gamma_j` 補正・[0008](0008-new-bpi-gamma-confidence-weighting.md) の IQR 信頼度重みはそのまま。指数にもう1つ因子を掛ける）
- **記録日**: 2026-09-09
- **対応issue**: epic #367 配下の検討（`/new-bpi` プレビューの調整。本番BPIは未変更）

## 背景

新方式の単曲BPI `BPI = 100·sign(ratio)·|ratio|^exponent`（`ratio = (z_ij − z0)/(z100_j − z0)`）の指数は `gamma_j` のみだった。`gamma_j`（≒1）のままだと、`BpiCalculator` が持つ per-song のカーブ形状（`|logS/logZ|^coef`、`coef` 中央値 ≈ 0.95・約80%の曲が `coef < 1`）が反映されず、`/new-bpi` 検証で `coef < 1` の曲（弁別力の高い地力譜面、全一が遠い高難度譜面等）が現行より系統的に辛く出ることを確認した。

## 検討した選択肢

| 案 | 概要 | 評価 |
|---|---|---|
| S0: `k = gamma_j` | 変更なし | 上記のとおり `coef < 1` 曲が辛い |
| **SA: `k = clamp(gamma_j · coef_j, 0.62, 3)`** | 現行 `coef` を指数に掛ける（踏襲）＋端の折れ・過剰な甘さを抑える下限 | 単曲BPIの現行本番との差分 mean +0.56、スコア帯を通じてほぼ一定。V 等の推定順位が実測順位に合う |
| SB: `k = clamp(gamma_j · f(sigma_j))` | `coef` を `sigma_j` の回帰で近似（旧 #301 方式） | `coef ~ sigma_j` は R²=0.03。回帰が実質フラットで意味を持たない → 不採用 |
| B: `k_j` を BPI↔順位式にフィット | 曲ごとに最小二乗フィットして現行の順位式に乗せる | 単曲 mean +7、総合はシフト法集約でさらに増幅 → 過大。プレビューの体感と合わず不採用 |

## 結論

**SA案を採用する。**

```
k_j  = clamp(gamma_j * coef_j, 0.62, 3)
BPI  = 100 * sign(ratio) * |ratio|^k_j
```

- `coef_j` は `songDef.coef`（`isCurrent = 1`）を `songParams.json` 生成時に固定した値。`coef` 未設定・0以下の曲は `coefMedian`（`coef` の全曲中央値、`songParams.json` に出力）。
- `ratio = 1`（スコア = WR）では `1^k_j = 1` なので、BPI100 = WR は厳密に保たれる（issue #302 の制約と両立）。
- 下限 `0.62`: `gamma_j` と `coef_j` がともに1を下回る曲で積が過小になり、`|ratio|^k` が BPI0 近傍でほぼ垂直接線になる（低BPI帯の不自然な折れ）＋中BPI帯が過剰に甘くなるのを抑える。値は、全一が極端に遠い高難度譜面群の推定順位が BPIM 内の実測順位帯に収まる水準に較正した。上限 `3` は破綻防止。

## 恣意性（正直な位置づけ）

- **統計的導出ではない**。`coef` は log-PGF スケール用に較正された値で、新方式の z スケールのカーブに掛ける具体的根拠は「現行のカーブ体感を踏襲する」という互換性論。`coef` 自体も §3 の逆算（経験式が目標）。
- **手順は固定・再現可能**：`coef` は定義生成のたびに算出、`gamma_j` は決定記録0005/0008 の固定式、`0.62` は定数。曲ごとの手調整はしていない。
- 下限 `0.62` は少数の外れ譜面の推定順位が実測順位帯に収まるよう選んだ値で、ad-hoc 寄りである点は留保する。
- gamma×coef の積は端で望まない値を出すためクランプで抑えている＝合成が末端で完全に principled ではないことの現れ。より原理的にするなら指数を「基準点→目標順位」で解析的に解く路線（案B）に戻る余地がある。

## 影響（実測、`sourceVintage: 2026-spring (03-21 base + per-song backfill)`）

- 単曲BPI（`NewBpiCalculator.calc` − `BpiCalculator.calc`）: mean **+0.56** / median +0.29 / p5 −2.3 / p95 +4.9。スコア帯（皆伝平均〜98%）を通じて mean は概ね +0.4〜+0.6。WR での `|新BPI − 100|` 最大 0.000。
- 全一が遠い高難度・ギミック譜面（`coef < 1` かつ `gamma_j < 1`、約28曲）が過小評価から補正される。

## 実装

- `scripts/generate-new-bpi-params.ts`: `songDef.coef` を各 `songs[sid]` に `coef` 出力、`coefMedian` を top-level 出力（`scripts/` は gitignore、生成物 `songParams.json` のみコミット）。
- `src/constants/iidx/newBpi/songParams.ts`: `NewBpiSongParam` に `coef?: number`、ファイル型に `coefMedian`、`NEW_BPI_COEF_MEDIAN` を export。
- `src/lib/bpi/newBpi.ts`: `curveExponent(gamma, coef)` を追加（`CURVE_EXP_MIN = 0.62` / `CURVE_EXP_MAX = 3` でクランプ）、`calc` / `calcFromBPI` / `predictUnplayedBpi` / `getSongParams` がこれを使う。`estimateRankFromBpi(bpi) = ceil(2616^((100−bpi)/100))` を追加。
- `/new-bpi` 一覧テーブルに「推定順位(新BPI)」「実際の順位(BPIM内)」列を追加（`useUserSongRankings` に `userId` 引数を追加し `songRankingCache` から取得）。
- `test/unit`（688件）通過。
