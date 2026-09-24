# beatmania IIDX ドメイン知識

BPIM2が扱う音楽ゲーム「beatmania IIDX」（SP専用。DPは扱わない）特有の用語・ゲームルールをまとめる。
コード中の変数名・定数・コメントの前提知識として、実装前に把握しておくべき内容。
コード上の実装詳細（型定義・関数シグネチャ等）はコードを読めば分かるため、ここには書かない。

## 基本用語

- **譜面 / 曲**: 1つの楽曲×1つの難易度の組み合わせを指す（`songs`テーブルの1行）。「曲」と言った場合も文脈上は譜面単位を指すことが多い
- **notes（ノーツ数）**: 譜面の総ノーツ数。EXスコアの理論値は `notes * 2`（`AAATableItem.maxScore`等）
- **EXスコア**: `PGREAT数*2 + GREAT数`で算出されるスコア。IIDXにおける実質的な「点数」。理論値（全ノーツPGREAT）が `notes*2`。これを表記するときにカンマ区切りは使わない（誤：1,234／正：1234）。スコアは各バージョンでリセットされる。
- **ミスカウント（BP: Bad+Poor）**: ノーツを外した回数。`missCount`として保存
- **DJ RANK**: EXスコアの達成率をアルファベットでランク分けしたもの。`F < E < D < C < B < A < AA < AAA < MAX-`。境界比率は `src/constants/iidx/rankBorders.ts` の `RANK_TABLE`（例: AAAは理論値の8/9、MAX-は17/18）。「AAA埋め」＝全譜面でAAAランク以上を達成する目標のこと
- **クリアランプ**: 各楽曲のクリア判定結果。下から `FAILED < ASSIST CLEAR < EASY CLEAR < CLEAR < HARD CLEAR < EX HARD CLEAR < FULLCOMBO CLEAR`（`src/constants/iidx/clearLamps.ts`の`CLEAR_STATES`、`src/lib/lamp/index.ts`の`LAMP_RANK`で数値化）。HARD CLEAR、EX HARD CLEARは「体力ゲージが0になったら即死」という条件下でのクリア、FULLCOMBO CLEARは全ノーツを繋ぎ切った場合の判定。クリアランプはバージョンをまたいでもリセットされない。
- **バージョン**: IIDXの作品（タイトル）番号。`src/constants/iidx/iidxVersions.ts`の`IIDX_VERSIONS`（`"26"`〜`"34"`、`"INF"`=INFINITAS）。`songs.releasedVersion`はその譜面が初出したバージョン
- **ソフラン（SOFLAN）**: 曲中でBPM（速度）が変化する譜面。`isSofran`フィルタや楽曲属性`p_soflan`/`g_soflan`、レーダーカテゴリ`SOFLAN`として扱われる
- **CN（チャージノート/ロングノート）**: 押しっぱなしにするノーツ。楽曲属性`p_cn`/`g_cn`

## 難易度・レベル

- 難易度種別（`IidxDifficulty`）: `HYPER` / `ANOTHER` / `LEGGENDARIA`。LEGGENDARIA譜面は一部の楽曲にしか存在しない。
- レベル（`IidxLevel`）: BPI計算対象は `"11"` と `"12"`（`IIDX_LEVELS`）。それ未満のレベルはBPI算出対象外（全曲ページ等では表示のみ）
- 全曲ページでは`BEGINNER`/`NORMAL`等の低難易度も扱う（`AllDifficulties`）が、BPI計算の対象外

## BPI（Beat Power Indicator）

「そのEXスコアが、プレイヤー全体の中でどれくらいの相対的な実力を示すか」を表す指標。実装は`src/lib/bpi/index.ts`の`BpiCalculator`（npm パッケージ`@bpim/bpicalc`の`BpiV2`をラップ、分布ベース再定義のV2モデル）。

- **皆伝（かいでん）**: IIDXの段位認定で最高位の称号。BPIの原典（伝統的なコミュニティ定義）では、この称号保持者相当の上級者層のスコア平均が**BPI 0 のアンカー（`kaidenAvg`）**という位置づけだった
- **`kaidenAvg`の実データソースに関する注意**: フィールド名・変数名は歴史的経緯で`kaidenAvg`のままだが、実際に値を生成しているクロール処理（`BPIM2-AutomatedDefinitionCalculator`リポジトリ）は段位「皆伝」保持者を判定しているわけではなく、**アリーナA帯（`arena_class: a1`〜`a5`）在籍プレイヤーのスコア平均**を採っている。つまり`kaidenAvg`の実体は「アリーナA帯平均スコア」であり、コード上の命名と実際の集計対象がズレている（名前だけを見て「皆伝所持者限定の平均」と誤解しないこと）
- **WR（World Record）スコア**: その譜面の世界記録EXスコア。**BPI 100 のアンカー**（＝理論上プレイヤーが到達しうるほぼ最高の実力を表す基準点）
- BPIが0付近＝アリーナA帯平均相当の実力、100付近＝世界記録相当の実力、という直感的な目盛りになる（マイナス値・100超も取りうる。マイナスは-15でクランプされる）
- `mu`/`sigma`/`residualVar`/`coef`は譜面ごとのALS（潜在変数）推定パラメータで、`songDef`（DB）由来。これらが無い譜面（ALS対象外・データ未収録）はBPI計算不可＝`null`
- **総合BPI**: 複数譜面の実力を1つの値に集約したもの（`calculateTotalBPI`、べき乗平均に相当する「シフト法」）。実際にプレイした譜面のBPIはそのまま使い、未プレイの譜面は「そのユーザーの潜在スキル」から予測値で埋めたうえで集約する。ダッシュボードやレーダーチャートの各カテゴリはこの総合BPIの応用
- **推定順位（`estimateRank`）**: 総合BPIから、アリーナ上位母集団内でのおおよその順位を逆算する（表示用の目安）
- **ラチェット**: 総合BPIの「記録」としての性質上、新しい算出値が過去の最高値を下回っても表示上は過去の最高値を維持する（`ratchetTotalBpi`）。個別譜面のBPIには適用されず、総合BPIのみの挙動

## アリーナ（Arena）

IIDX本編内蔵のランクマッチ的な対戦・ランキング機能。プレイヤーは実力に応じたクラス（アリーナランク）に格付けされる。

- ランク順（上位→下位）: `A1 > A2 > A3 > A4 > A5 > B1 > B2 > B3 > B4 > B5`（`ARENA_RANK_ORDER`）。`A1`〜`A5`は「A帯」（`A_RANKS`）と呼ばれる上位帯
- アリーナ関連の平均スコア等の統計は、公式サイト（eAMUSEMENT）側のデータ提供が最新バージョンに追いついていないことがあり、その場合`arenaDataVersion`で1つ前のバージョンのデータを暫定的に参照する
- BPIモデルのグローバル定数（`z0`等）はこのアリーナA帯所属者の実データをクロールして統計的に推定したもの（`src/constants/iidx/newBpi/modelConstants.ts`）

## レーダーチャート（6カテゴリ）

IIDX本編のプレイヤーレーダーチャート機能に対応する、6軸の「タイプ別総合BPI」。各譜面は`topElements.json`によっていずれか1カテゴリに一意に分類され、カテゴリごとに総合BPIを計算する（`src/lib/radar/calculator.ts`）。

- `NOTES`（物量）/ `CHORD`（複合・同時押し）/ `PEAK`（急激なピーク配置）/ `CHARGE`（CN・纏り）/ `SCRATCH`（皿絡み）/ `SOFLAN`（ソフラン）
- **楽曲属性（`SONG_ATTRIBUTES`）とは別物**: 属性は「皿」「同時押し」「縦連」等11軸の連続値スコア（曲の傾向を数値化、検索・ソート用途）で、譜面が複数属性を持てる。レーダーカテゴリは6分類の排他的な1譜面1カテゴリの分類（総合BPI計算用途）。混同しないこと

## IIDX Tower

公式サイトの「日別の鍵盤/スクラッチ入力回数」記録に対応する機能（`iidxTower`テーブル、`keyCount`/`scratchCount`を日付・バージョン単位で保持）。BPIやスコアとは独立した「どれだけ鍵盤を押した/スクラッチを回した」の運動量指標。スコア・クリア状況とは無関係の集計軸。

## 月間レビュー（Monthly Review）

指定期間（月 / 年 / バージョン全体`"all"`）でのプレイ活動・BPI推移・伸びた曲等をまとめる振り返り機能。「バージョン全体」モードは、バージョンごとの稼働開始日を厳密管理する代わりに「そのバージョン発売より確実に前の固定日付〜当日」を期間として扱う（`resolveMonthlyReviewPeriod`）

## 注意点

- 本アプリはSP（シングルプレー）専用。DP（ダブルプレー）のデータ構造・BPIモデルは存在しない
- 「レベル」「難易度」「バージョン」「クリアランプ」「DJ RANK」はいずれもゲーム側の一次データであり、BPIはそこから二次的に算出される値（EXスコアが同じでも譜面ごとの`mu`/`sigma`次第でBPIは変わる）
