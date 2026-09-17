# BPIオプティマイザをBPI(V2)ネイティブで作り直す

- **ステータス**: 採用（issue化・実装着手）
- **背景issue**: 本提案がissue化の起点。実装issueは #465
- **前提**: BPI(V2)の数式は [docs/bpi-math.md](../bpi-math.md) §7（特に §7.5 総合BPI集約）、実装は `@bpim/bpicalc`（`BpiV2`/`PlayerBpiV2`、[`../../../@bpim-bpicalc/src/v2.ts`](../../../@bpim-bpicalc/src/v2.ts)）
- **関連の応急処置**: 本提案の直前に、`src/lib/subhandlers/bpiOptimizer/optimizer.ts`がDBの`scores.bpi`(V2)をV1前提の探索エンジン(`src/lib/bpi/optimizer.ts`)にそのまま渡していた不整合（fromBpi/toBpiの基準がV1/V2で混在し効率計算・到達判定が破綻）を、探索全体をV1へ揃え直すパッチで暫定修正済み。しかしユーザー指摘の通り、これは「V1の中でだけ自己整合する」延命措置であり、V2の実際の予測（後述）とは無関係な数値を返し続けるため、本質的な解決にならない

## 1. なぜ「V1のまま延命」では原理的に成立しないか

BPIオプティマイザの既存実装（`BpiOptimizer`クラス、issue #380以前からある設計）は、「各曲の単曲BPIは他の曲と独立に決まる」という前提の上に、べき乗平均で総合BPIを合成していた（V1: `docs/bpi-math.md` §4.2）。この前提の下では「この曲を伸ばせば総合BPIがこれだけ増える」という**曲ごとの独立な限界貢献**を計算でき、それを効率スコアにして貪欲探索する、という設計が成立する。

BPI(V2)の総合BPI（§7.5）はこの前提を満たさない。未プレイ曲のBPIは固定値(-15)ではなく、**プレイヤーの潜在スキル`a_shrunk`から予測**される（`predictUnplayed`）。`a_shrunk`は「今までプレイした全曲の観測」から求まる**プレイヤー1人に1つのグローバルな値**なので、

- ある1曲を新たにプレイする（または伸ばす）と`a_shrunk`が動く
- `a_shrunk`が動くと、**その曲だけでなく、他の未プレイ曲全ての予測BPIも連動して動く**（`info`由来の信頼度重み`w = info/(info+1)`もグローバルに動く）

つまりV2では「1曲だけの限界貢献」が独立に定義できず、総合BPIは**その時点の全観測を集合として見て初めて決まる**。V1のまま固定した現状のワークアラウンド（"legacyV1"）は、この結合を完全に無視して各曲を独立に計算しているため、返ってくる`currentTotalBpi`・各ステップの`toBpi`は実際にアプリの他画面（ダッシュボード等）が表示するV2の総合BPIと**別物の数値**になる。添付いただいた実行結果（未プレイ曲を7曲＝EXスコアで数千点分プレイする提案なのに、総合BPIが34.26→34.31とほぼ動かない）は、V1延命パッチが生成した数値ではなく、V2ネイティブに作り直した場合に実際に起きうる**正しい現象**でもある（後述4章）。すなわち「壊れている」のはV1延命の数値がV2と一致しないことと、そもそもV1由来の成長ヒューリスティクス（1曲あたりの上げ幅の仮定等）がV2の実際の予測値と整合しないまま探索していること両方であり、ゼロベースでV2の数式に沿って再設計する以外に恒久対応はない。

## 2. V2の総合BPIが持つ、オプティマイザ設計に直結する性質

`docs/bpi-math.md` §7.5、`@bpim/bpicalc` `PlayerBpiV2`（[v2.ts:135-221](../../../@bpim-bpicalc/src/v2.ts#L135-L221)）より、オプティマイザの設計に直接影響する事実を整理する。

### 2.1 潜在スキル推定は「観測ごとの寄与」に線形分解できる（O(1)増分更新できる）

```
num  = Σ_j sigma_j (t_j - mu_j) / ev_j      // t_j = -ln(max(0.5, m_j - clamp(s_j,0,m_j)))
info = Σ_j sigma_j² / ev_j                  // ev_j = 曲別residualVar、無ければ全曲共通residualRmse²
a_shrunk = num / (info + 1)
w = info / (info + 1)                        // 信頼度（事後分散1/(info+1)の補数）
```

`num`・`info`はどちらも「観測1件あたりの加算項の総和」なので、既存のプレイ済みスコアに1曲分の仮想プレイを追加するコストは**その1件の加算だけ（O(1)）**。全曲を舐め直す必要はない。

### 2.2 未プレイ曲の予測BPIは、更新された`a_shrunk`/`w`から曲ごとにO(1)で再計算できる

```
BPI_pred_j = 100 * sign(ratio_j) * |ratio_j|^k_j,  ratio_j = (a_shrunk - z0)/(z100_j - z0)
BPI_blend_j = w * BPI_pred_j + (1-w) * (-15)
```

`z0, z100_j, k_j`は曲ごとに固定（`songDef`由来）なので、`a_shrunk`・`w`が更新された後、各未プレイ曲の予測値の再計算は曲ごとにO(1)。ただし**候補プール全体（残り未プレイ曲すべて）を毎ステップ再計算する必要がある**（V1のように「他の曲の値は不変」という前提が使えない）。

### 2.3 総合BPI（シフト法べき乗平均）はO(n log n)で決定的に計算できる

```
c = 15,  k' = ln(n) / ln((100+c)/(50+c))
総合BPI = ( Σ_i (BPI_i + c)^k' / n )^(1/k') - c   // 降順ソートして上位nを使用、足りない分は-15で埋め
```

nは対象譜面数で固定（本アプリでは☆12全曲、実測648前後）なので、1回の計算コストは常に一定。**ランダムリトライで近似する必要はなく、任意の仮想プレイ集合に対して厳密な総合BPIを直接計算できる**（`BpiCalculator.calculateTotalBPI`が既にこのAPIを提供している）。

### 2.4 限界貢献の一次近似（勾配）も閉形式で書ける

総合BPI = `T = (Σ (BPI_i+c)^k' / n)^(1/k') - c` を1曲のBPI_iについて偏微分すると

```
∂T/∂BPI_i = ( (BPI_i + c) / (T + c) )^(k' - 1) / n
```

これは「その曲が総合BPIの上位に近いほど（`BPI_i`が`T`に近いほど）比が1に近づき、下位曲（`BPI_i`が`T`より大きく下回る曲）ほど比が0に近づく」という、シフト法べき乗平均が上位曲に支配される性質（`docs/bpi-math.md` §4.3）をそのまま表す解析的な重みである。全候補を厳密再計算する前の**足切り用の一次近似（マジックナンバーではなく解析的に導出された量）**として使える（4.2節）。

### 2.5 「得意・不得意カテゴリ」も同じ縮小推定の枠組みで表現できる（未プレイ曲の上振れ見積もりに使う）

§3.4で述べる通り、V2は「未プレイ曲を今プレイしたら何点相当か」の**平均的な**予測（`a_shrunk`によるグローバルな予測）はできるが、「このプレイヤーが得意な系統の曲なら、平均予測よりさらに伸ばせる」という個人差は`a_shrunk`単体では表現できない。これを一からのヒューリスティクス（固定マージン）で埋めるのではなく、**`a_shrunk`の縮小推定（決定記録0006・0010、`docs/bpi-math.md` §7.5）と全く同じ数学的枠組みを、レーダーカテゴリ単位に1段追加するだけで表現できる**。

プレイ済み曲`j`の実測`z`値（曲固有スケール）と、その時点のグローバル`a_shrunk`との残差

```
residual_j = z_j - a_shrunk = (t_j - mu_j)/sigma_j - a_shrunk
```

は「そのプレイヤーがこの曲個別に、平均的な実力から見てどれだけ上振れ/下振れしているか」を表す。これをレーダーカテゴリ`c`（既存の`topElementMap`分類、6カテゴリ）ごとに**同じ精度重み・同じ縮小推定の式**で集約する。

```
num_c  = Σ_{j∈c, played} sigma_j * (t_j - mu_j - sigma_j * a_shrunk) / ev_j
       = ( Σ_{j∈c, played} sigma_j(t_j-mu_j)/ev_j ) - a_shrunk * ( Σ_{j∈c, played} sigma_j²/ev_j )
info_c = Σ_{j∈c, played} sigma_j² / ev_j

categoryBias_c = num_c / (info_c + 1)     // 事前 categoryBias_c ~ N(0,1) との同型の縮小推定
```

`categoryBias_c > 0`はそのカテゴリで平均予測より上振れしている（得意）、`< 0`は下振れ（苦手）を意味し、`info_c`（＝そのカテゴリでの観測の精度合計）が小さいうちは自動的に0（＝カテゴリ差なし、グローバル予測のみ）へ縮小される。これは既存の`radarCategoryBpis`（レーダーチャートの「得意・不得意」表示）と**同じ入力（カテゴリ別プレイ済みスコア）から出発する、より細かい粒度の推定**であり、新しい統計的仮定を持ち込むものではない。

未プレイ曲`j`（カテゴリ`c`）の予測は、グローバル`a_shrunk`の代わりに`a_shrunk + categoryBias_c`を使う（カテゴリ情報が無い曲は`categoryBias_c = 0`扱いでグローバル予測に一致する）。

```
z_pred_j = a_shrunk + categoryBias_c
ratio_j  = (z_pred_j - z0) / (z100_j - z0)
BPI_pred_j = 100 * sign(ratio_j) * |ratio_j|^k_j
```

`num_c`・`info_c`も§2.1と同じ理由でO(1)増分更新できる（1曲プレイを追加するたびに、そのカテゴリの`num_c`/`info_c`だけを更新すればよい）。

## 3. クラス構成案

現状の`src/lib/bpi/optimizer.ts`は「BpiMath（V1のべき乗平均を手書きで再実装）」「BpiOptimizer（探索・ヒューリスティクス・スコアリングを1クラスに凝集、マジックナンバー約30個）」の2クラス構成で、V1の数式を`@bpim/bpicalc`とは別に手で再実装していた。これがissue #380で「V1は据え置き」という判断を招いた根本原因（V2に追従させる先が2箇所になる）でもある。

再設計では**BPI計算そのものを一切再実装せず、`@bpim/bpicalc`のV2 API（`BpiCalculator`経由）を単一の真実源として呼ぶ**。オプティマイザ側が持つのは「探索戦略」「達成可能性の見積もりヒューリスティクス」「候補の絞り込み」だけにする。

```
src/lib/bpi/optimizer/
├── index.ts              # バレル。findOptimalBpiPath(v2版)をexport
├── constants.ts           # 探索アルゴリズム固有の定数（全て名前付き・根拠コメント必須）
├── latentSkillTracker.ts  # LatentSkillTracker: num/info/a_shrunk/wの増分管理（§2.1）
├── categoryAffinityTracker.ts # CategoryAffinityTracker: カテゴリ別num_c/info_c/categoryBiasの増分管理（§2.5）
├── songBpiCache.ts        # SongBpiCache: 候補曲ごとの現在BPI（測定値 or 予測値）のキャッシュと再計算（§2.2, §2.5）
├── totalBpiEvaluator.ts   # TotalBpiEvaluator: 厳密な総合BPI計算(BpiCalculator委譲) + 一次近似勾配(§2.4)
├── achievementCeiling.ts  # AchievementCeilingResolver: 「この曲でどこまで伸ばせるか」の統一ロジック（§3.4）
├── candidateScorer.ts     # CandidateScorer: 効率スコアリング（一次近似→上位K件のみ厳密評価）
└── engine.ts               # BpiOptimizerEngine: ステップループ本体（旧BpiOptimizerに相当）
```

### 3.1 `LatentSkillTracker`

```ts
class LatentSkillTracker {
  private num = 0;
  private info = 0;

  constructor(initialObservations: IBpiScoreObservation[], private readonly songMaster: RadarSongMaster) {
    for (const obs of initialObservations) this.add(obs);
  }

  /** 1件の観測（実測 or 仮想プレイ）を追加し、num/infoを増分更新する（O(1)）。 */
  add(obs: IBpiScoreObservation): void { /* §2.1 の num += / info += */ }

  get aShrunk(): number | null { return this.info > 0 ? this.num / (this.info + 1) : null; }
  get confidence(): number { return this.info / (this.info + 1); } // w
}
```

`@bpim/bpicalc`は`num`/`info`を外部に公開していない（`PlayerBpiV2`はコンストラクタで一括計算する設計）ため、この増分トラッカーはbpim2側で持たざるを得ない。ただし**計算式自体は`@bpim/bpicalc`のソース（`v2.ts:140-158`）から一字一句移植**し、独自の近似や簡略化を混ぜない。将来`@bpim/bpicalc`側に増分更新API（例: `PlayerBpiV2.withObservation(obs)`）が追加されたら、このクラスは`@bpim/bpicalc`への薄いラッパーに置き換えて重複を解消する（追従忘れリスクを`@bpim/bpicalc`側のテストに一本化できる）。

### 3.2 `SongBpiCache`

各候補曲について「現在のBPI（プレイ済みなら測定値、未プレイなら`LatentSkillTracker`から予測した値）」を保持し、`LatentSkillTracker`が更新されるたびに未プレイ分だけ再計算する。

```ts
class SongBpiCache {
  private readonly bpiById = new Map<number, number>(); // songId -> 現在のBPI

  /** 初期化: 全曲について測定値 or 予測値をセット */
  constructor(songs: SongMasterEntry[], skill: LatentSkillTracker) { /* ... */ }

  /** 1曲を仮想プレイした後、他の未プレイ曲の予測値を再計算する（§2.2、O(残り未プレイ数)）。 */
  refreshUnplayed(skill: LatentSkillTracker, playedSongId: number): void { /* ... */ }

  currentBpi(songId: number): number { return this.bpiById.get(songId) ?? -15; }
  snapshot(): number[] { return [...this.bpiById.values()]; }
}
```

未プレイ曲の予測値はここでは**カテゴリ補正を含めないグローバル予測**（§2.2そのまま）を使う。理由は、`snapshot()`/`currentBpi()`は「今の総合BPI」を`TotalBpiEvaluator.exact`（＝`BpiCalculator.calculateTotalBPI`、アプリの他画面と共通の計算）に渡すための入力であり、ここにカテゴリ補正のような**オプティマイザ独自の裁量**を混ぜると、他画面の総合BPIと再びズレる（本提案が解決しようとしている問題そのもの）。カテゴリ補正（§2.5）は「どこまで狙うか（目標EXスコア）」の見積もりにのみ使う、という区別を3.4節で明確化する。

### 3.3 `TotalBpiEvaluator`

```ts
class TotalBpiEvaluator {
  constructor(private readonly totalSongCount: number) {}

  /** 厳密な総合BPI。BpiCalculator.calculateTotalBPIへ委譲する（数式を再実装しない）。 */
  exact(observations: IBpiScoreObservation[], allSongs: SongMasterEntry[]): number {
    return BpiCalculator.calculateTotalBPI(observations, allSongs);
  }

  /** §2.4の解析的勾配。厳密再計算の前段フィルタ専用（最終判定には使わない）。 */
  marginalGainEstimate(currentTotal: number, songBpi: number, kPrime: number): number {
    const c = 15;
    return Math.pow((songBpi + c) / (currentTotal + c), kPrime - 1) / this.totalSongCount;
  }
}
```

### 3.4 `AchievementCeilingResolver`（プレイ済み・未プレイを同じ考え方で扱う）

V1延命実装、および本提案の当初案（§3.4旧版）は「未プレイ曲はモデルの平均予測＋固定マージン」「プレイ済み曲は別の固定マージン」という、プレイ済み/未プレイで別々のヒューリスティクスを使っていた。ユーザー指摘の通り、**未プレイ曲についても「似た曲（同じレーダーカテゴリ）でどれだけ上振れしているか」という実測データがあるなら、それをプレイ済み曲と同じ土俵の「上振れ実績」として使うべき**であり、両者を統一できる。

```
z_baseline_j =
  played_j  ? z_j (実測)                              // プレイ済み: 実測z値そのもの
           : a_shrunk + categoryBias_c(j)              // 未プレイ: グローバル予測 + カテゴリ得意/不得意補正（§2.5）

ceiling_j = f_j( z_baseline_j + GROWTH_MARGIN_Z )       // f_j: §2.2と同じ曲固有のz→BPI変換
```

`GROWTH_MARGIN_Z`（z値ベースの上振れ幅。プレイ回数を重ねる・粘着して詰める、といった「モデルが説明しない伸びしろ」）はプレイ済み・未プレイで**同一の1個の定数**になる（旧案の`GROWTH_MARGIN_BPI`と異なりz値ベースにするのは、BPIのカーブ`f_j`が曲ごとに非線形なので、BPI値に定数を足すより「潜在能力スケールに定数を足してから曲固有カーブに通す」方が曲間で公平になるため）。得意レーダー要素（`radarCategoryBpis`）は、この`categoryBias_c`という形でヒューリスティクス層そのものに組み込まれ、旧案のように「候補の並べ替えスコアへの加点」という別経路を持つ必要がなくなる。

未プレイ曲でも`categoryBias_c`が採用されている点が§2.5の要旨:「類似曲（同カテゴリ）でどれだけ上振れしているか」を、`a_shrunk`と全く同じ縮小推定の式でカテゴリ単位に推定し、そのカテゴリの未プレイ曲に適用する。`info_c`が小さい（そのカテゴリでの観測が少ない）うちは自動的に`categoryBias_c → 0`に縮小されるため、データが薄いカテゴリで過大評価するリスクも同じ数式内で抑制される。

### 3.5 `CandidateScorer`（2段階評価で計算量を抑える）

1ステップあたりの計算量を、旧実装の「候補数 × ステップ数 × 100リトライ」から「候補数（安価な近似）＋ 上位K件のみ厳密評価」に落とす。

1. **安価な一次選抜**（候補全件、O(候補数)）: `AchievementCeilingResolver`で見積もった目標BPIと`TotalBpiEvaluator.marginalGainEstimate`（§2.4の解析的勾配）から効率スコアを概算し、上位`CANDIDATE_POOL_SIZE`件に絞る
2. **厳密評価**（上位K件のみ、O(K × n log n)）: 各候補について実際に`observations`に仮想プレイを追加した状態で`TotalBpiEvaluator.exact`を呼び、真の総合BPI増分を得る。この差分をEXスコア必要増分で割った値を最終効率スコアとする
3. 既存UXの「毎回同じ経路にならない」多様性は、この厳密評価後の上位プールから重み付き乱択で1曲選ぶ（旧`pickFromPool`と同じ思想、対象がV1近似値ではなく厳密なV2差分になる点のみ異なる）

### 3.6 `BpiOptimizerEngine`

旧`BpiOptimizer.execute`/`runStep`に相当するループ本体。責務は「ループを回し、`CandidateScorer`が選んだ曲を`state`に確定反映し、`LatentSkillTracker`・`SongBpiCache`・observationsを更新する」ことだけに絞る（スコアリングの中身は持たない）。

### 3.7 `ColdStartGuard`（データが薄いカテゴリは推定せず、先にプレイを促す）

§2.5の`categoryBias_c`は`info_c`が小さいと自動的に0へ縮小されるが、これは**数式上「グローバル予測に静かにフォールバックする」だけ**であり、「このカテゴリはデータが薄いので信頼できない」という事実そのものはユーザーに伝わらない。ユーザー指摘の通り、データが薄いカテゴリについては**無理に見積もりを出して弱いプランを提示するより、先に数曲プレイしてデータを作ってもらう方が誠実**なので、`categoryBias_c`を計算に使う前段にガードを1つ挟む。

```
w_c = info_c / (info_c + 1)     // §2.5のcategoryBias_c自身が持つ信頼度（事後分散1/(info_c+1)の補数）

category cは「コールド」 ⟺ w_c < CATEGORY_CONFIDENCE_THRESHOLD
```

`w_c`は§2.1の`w`（全体の信頼度）と全く同じ導出のカテゴリ版であり、新しい統計量ではない。閾値`CATEGORY_CONFIDENCE_THRESHOLD`（例: `0.5` = 「事後分布の半分以上がそのカテゴリの実測に基づいている」）を1つ定義するだけで済む。

判定結果の扱い:

- **コールドなカテゴリの未プレイ曲は候補プールから除外する**（`categoryBias_c`をグローバル予測へのフォールバックとして黙って使わない。§3.4の`z_baseline_j`計算に到達させない）
- 除外したカテゴリを`coldCategories: { category, playedCount, suggestions: SongRef[] }[]`として結果に含める（`suggestions`は`topElementsByCategory`からノーツ数などで代表的な数曲を選ぶ。「まずこの曲を数曲プレイしてみてください」の具体案として提示するため）
- **全カテゴリがコールド**（新規ユーザー等で☆12の観測がほぼ無い、`info`自体が閾値未満）の場合は、探索を試みずに`coldCategories`のみを返す専用の結果（`achievable: false`相当だが理由が「未達成」ではなく「データ不足」である旨を区別できるフィールドを追加する。§5のOptimizationResult拡張を参照）
- 一部カテゴリのみコールドな場合は、残りのカテゴリ・プレイ済み曲だけで探索を継続する（目標に届けば通常の結果を返し、`coldCategories`は参考情報として併記するのみ。無理に停止しない）

## 4. 設計上の副作用（ユーザーへの見せ方の検討が必要）

V2ネイティブに作り直しても、**「未プレイ曲を1曲追加しても総合BPIがほとんど動かない」ケースは一定残る**（添付の実行結果がまさにこれ）。理由は、未プレイ曲は既に「プレイヤーの潜在スキルからの予測値」として総合BPIに織り込まれているため（§7.5）、実際にプレイして得たBPIが予測とほぼ一致していれば差分はほぼゼロになるから。§3.4のカテゴリ補正（`categoryBias_c`）を導入すると、得意カテゴリの未プレイ曲では「平均予測より上振れする」分だけ`bpiGain`が実際に大きくなる（＝旧案のBという場当たり的な対応ではなく、実測に基づいて自然に解消される部分がある）ため副作用は当初案より小さいと見込まれるが、以下は依然として残る論点:

- **カテゴリ情報が無い曲・得意カテゴリが無いプレイヤー**は§3.7の`ColdStartGuard`が「コールド」として候補から除外し、代わりに「まずこの曲を数曲プレイしてください」という具体的な案内を返す（無理な推定を出さない、という方針を実装レベルで担保する）。閾値`CATEGORY_CONFIDENCE_THRESHOLD`の具体値は実データで較正する必要がある（5章）
- `GROWTH_MARGIN_Z`が「モデルが説明しない伸びしろ」を過大に見積もると、達成可能性(`achievable`)の判定が楽観的になりすぎるリスクがある。実データ（テスト用ユーザーの実測プレイ履歴）で`GROWTH_MARGIN_Z`を較正し、5章の受け入れ基準に「実測との乖離が一定範囲に収まること」を含める

上記は実装前の最終確認事項として、**5章の受け入れ基準に文言含めて明記**する。

## 5. 移行方針

- 本提案が対応する範囲は`src/lib/bpi/optimizer.ts`（探索エンジン本体）と`src/lib/subhandlers/bpiOptimizer/optimizer.ts`（呼び出し元）。`OptimizationResult`/`OptimizationStep`/`SongOptimizerInput`等の外部型（UI・`optimizeMemo`保存スキーマが依存）は据え置き、内部実装のみ置き換える。ただし§3.7の`coldCategories`は既存フィールドを壊さない**追加のオプショナルフィールド**として`OptimizationResult`に足す必要があり、UI（`OptimizationSummary`等）・`optimizeMemo`保存スキーマ（`src/schemas/optimizeMemo/create.ts`）側もこのフィールドを扱えるよう合わせて拡張する
- `src/lib/subhandlers/bpiOptimizer/optimizer.ts`は、直近のV1延命パッチ（V1で曲別BPI・レーダー別BPIを引き直す処理）を削除し、`calculateRadar`（V2, 既存）をそのまま使う形に戻せる（V1固有の分岐が不要になるため、むしろ現状より簡潔になる）
- `test/unit/logic/bpiOptimizer.test.ts`はV1の数式を前提にしたフィクスチャなので全面的に書き直しが必要
- 本提案の採用が決まったら、feature_spec形式のissueを起票し（`feat/`ブランチ、`staging`宛PR、`issue-driven-development.md`の運用に従う）、4章の残論点（カテゴリ情報が薄いケースの見せ方・`GROWTH_MARGIN_Z`較正）をissueの受け入れ基準に明記した上で着手する
