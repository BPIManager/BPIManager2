# BPIManager2

## プロジェクト概要

beatmania IIDXのスコア管理Webアプリ。Next.js (App Router **ではなく** Pages Router) + TypeScript + Tailwind CSS v4 + shadcn/ui。DBはMySQL (Kysely ORM)、認証はFirebase Auth。

## コマンド

```bash
pnpm dev        # 開発サーバー起動 (--experimental-https)
pnpm build      # ビルド
pnpm test       # vitest（unit + integration）
pnpm test:unit  # vitest（外部依存なしのunitのみ、日常はこちら）
pnpm lint       # eslint
```

## ディレクトリ構成

```
src/
├── pages/          # Next.js Pages Router（画面 & API Routes）
│   └── api/v1/     # REST API: /users/[userId]/...
├── components/
│   ├── partials/   # ページ固有・共有の複合コンポーネント（詳細は後述）
│   └── ui/         # shadcn/ui ベースの汎用UIコンポーネント
├── hooks/          # SWRフェッチ + ローカル状態ロジック（ドメイン別サブディレクトリ）
├── lib/
│   ├── bpi/        # BPI計算ロジック（BpiCalculator クラス）
│   ├── db/         # Kyselyクエリ（ドメイン別サブディレクトリ）
│   ├── firebase/   # Firebase Admin / Client 初期化
│   └── discord/    # Discord.js ボット
├── types/          # 型定義（db.ts はkysely-codegen自動生成）
├── constants/      # 定数（バージョン、ランク、BPM等）
├── services/       # SWRフェッチャー / Next.js API リクエストヘルパー
└── utils/          # 純粋関数ユーティリティ
```

## アーキテクチャ

- **Pages Router**: `src/pages/` 以下。`pages/api/` はAPIルート
- **データフェッチ**: クライアントはSWR (`src/services/swr/`)、サーバーはKysely (`src/lib/db/`)
- **パスエイリアス**: `@/` → `src/`
- **DB型**: `src/types/db.ts` はkysely-codegenで自動生成
- **認証**: Firebase Auth（クライアント） + Firebase Admin（APIルート）
- **テスト**: vitest + @testing-library/react、`test/unit`（外部依存なし）/ `test/integration`（devサーバー等が前提）に分離。詳細は [test/README.md](test/README.md)

## コアドメイン

### BPI計算 (`src/lib/bpi/index.ts`)

`BpiCalculator` 静的クラス:

- `calc(exScore, song)` → 単曲BPI
- `calcFromBPI(targetBpi, song)` → 目標BPIに必要なEXスコア
- `calculateTotalBPI(allBpis, totalSongCount)` → 総合BPI（べき乗平均）
- `estimateRank(totalBpi)` → 皆伝内推定順位

### DBスキーマ主要テーブル

`songs`, `scores`, `logs`(バッチ単位のスコア更新), `users`, `follows`, `allSongs`/`allScores`(全難易度), `userRadarCache`, `notifications`, `userRoles`, `discordLinks`

### API構造

全て `/api/v1/users/[userId]/` 以下:

- `scores`, `batches/[batchId]`, `stats/*`, `rivals/*`, `all-scores/*`, `ranking/*`, `notifications`

## コーディング規約

- コンポーネントはデフォルトエクスポート、型はnamed export
- スタイルはTailwind CSS v4のユーティリティクラス（`globals.css` はほぼ空）
- 数値がキャノニカルなスペーシングスケールに乗る場合、`h-[30px]`のような任意値記法ではなく`h-7.5`のようなキャノニカルクラスを使う（Tailwind v4はスペーシングスケールが`calc(var(--spacing) * N)`で任意の数値に対応しているため、`px`値を4で割った数値がそのままクラス名になる）。フォントサイズや色など、スペーシングスケールに乗らない値は任意値記法のままでよい。
- UI部品はshadcn/ui (`src/components/ui/`)を優先利用
- Kyselyクエリは `src/lib/db/` 配下の4分類（`domains/`・`orchestrators/`・`aggregates/`・`shared/`）に整理する。詳細・配置判断フローは後述の「`src/lib/db/` ディレクトリ構成」を参照
- SWRフックは `src/hooks/[ドメイン]/` に配置、フェッチャーは `src/services/swr/` に分離
- `src/constants/radars/topElements.json` (~95KB) は大きいので直接読まない
- 新しいDB参照クエリを書くときは既存のDBスキーマ(`migrations/schema.sql`)を確認し、インデックスが最適化どうかを確認すること。可能であれば、既存のインデックスで高速なクエリを書くように努める。
- `src/pages/api/`配下（APIルート）・`src/lib/mcp/tools/`・`src/lib/cron/`等の呼び出し元レイヤーで`import { db } from "@/lib/db"`し、Kyselyクエリを直接書くことは禁止。どんなに小さい単一テーブル参照(`db.selectFrom("users").select(...).where("userId","=",userId).executeTakeFirst()`等)でも、対応する`domains/[ドメイン]/index.ts`（複数テーブルに及ぶ場合は`aggregates/`）にメソッドとして追加し、呼び出し元はそのメソッドを呼ぶ。同じクエリ形が2箇所以上に登場したら、新規に書く前に既存メソッドで代替できないか確認する
- 複数テーブルにまたがる書き込み(バッチ削除等)を実装するときは、各テーブルへのクエリはそのテーブルを所有するドメインリポジトリ(`src/lib/db/domains/[ドメイン]/index.ts`)のメソッドとして実装し、他ドメインのテーブルへ直接クエリを書かない。トランザクションを開始する側は`db.transaction().execute(trx => ...)`で各ドメインのメソッドを呼び出す**オーケストレーション役**（`src/lib/db/orchestrators/`）に徹する。各メソッドは第一引数に`trx: Transaction<Database>`を受け取り、呼び出し元のトランザクションに参加できるようにする(例: [`src/lib/db/domains/scores/index.ts`](src/lib/db/domains/scores/index.ts)の`deleteByBatch`、[`src/lib/db/domains/logs/navigation.ts`](src/lib/db/domains/logs/navigation.ts)の`deleteBatch`)。

### `src/lib/db/` ディレクトリ構成

DBリファクタリング（#151〜#161）により、`src/lib/db/` 直下は役割ごとに4つに分類されている。新しいクエリを書くときは、まずどの分類に属するかを判断してから配置する。

```
db/
├── domains/        # 単一テーブルを所有するドメインリポジトリ（例: scores/, songs/, users/）
├── orchestrators/  # 複数ドメインの書き込みを跨ぐトランザクション調整役
├── aggregates/     # 複数ドメインを跨ぐ読み取り専用の集計・複合ビュー（例: stats/, siteStats/, userProfiles/）
├── shared/         # 副作用のない共通クエリビルダー・ヘルパー（例: latestScore.ts, songRanking.ts）
└── index.ts        # Kysely接続シングルトン（上記4分類のいずれにも属さないインフラ層）
```

- **domains/**: 単一テーブルの読み書きを担当する。他ドメインのテーブルへ直接クエリを書いてはいけない（書き込みは`orchestrators/`、読み取りは`aggregates/`か関連の深い`domains/`側のメソッドを追加して委譲する）
- **orchestrators/**: 複数ドメインへの書き込みをまたぐトランザクションを`db.transaction().execute(trx => ...)`で開始し、各`domains/`のメソッドを呼び出す。自身では個別テーブルへ直接クエリを書かない
- **aggregates/**: 複数ドメインのテーブルを横断JOIN・集計してユーザー向けの複合ビューを組み立てる。単純な単一テーブル参照（フィルタ・カウント等）は対応する`domains/xxx`の公開メソッドを追加してそこへ委譲し、複雑なJOIN・集計で分離するとパフォーマンスが大きく悪化するものだけ直接参照を許容する（その場合は理由をコメントで残す）。依存方向は必ず `aggregates/ → domains/` の一方向とし、`domains/`側から`aggregates/`の関数を呼ぶ（逆方向の依存を作る）ことはしない
- **shared/**: 副作用のない共通クエリビルダー・SQLヘルパー。`domains/`・`aggregates/`双方から利用してよい

新規クエリを追加する際の配置判断フロー:

1. 参照・更新するテーブルが1つだけ → 該当ドメインの`domains/[ドメイン]/index.ts`にメソッドを追加する
2. 書き込みが複数テーブルに及ぶ → 各テーブルへの書き込みは所有ドメインのメソッドとして実装し、`orchestrators/`側でトランザクションを開始してそれらを呼び出す
3. 読み取りが複数テーブルに及ぶ → 単純な参照の組み合わせなら各ドメインの公開メソッドを呼び出して`aggregates/`側で合成する。JOIN自体を分離するとパフォーマンスが大きく悪化する場合のみ`aggregates/`内に直接クエリを書き、コメントで理由を残す

### 統合ファサードオブジェクトを作らない

`domains/`・`aggregates/`配下の各サブファイル（`tables.ts`/`charts.ts`/`social.ts`のように責務ごとに分けたリポジトリ）を、呼び出し側の利便性のために1つの`xxxRepo`オブジェクトへ再集約する`index.ts`（例: 各メソッドを`.bind()`で束ねるファサード）を新規に作らない。このパターンは一見便利だが、無関係な責務が1ファイルに同居し続ける温床になり、行数が肥大化してから分割 → 呼び出し元更新という手戻り作業（issue #182, #183, #181等）を繰り返し発生させてきた。

- 呼び出し元は分割済みの各リポジトリ（例: `statsTablesRepo`, `statsChartsRepo`, `statsSocialRepo`）を該当ファイルから直接importする
- 1ファイルが責務ごとに分割された場合、集約用の`index.ts`は作らずに削除し、呼び出し元のimportを分割後の各ファイルへ直接向ける
- 後方互換のためだけの再export（`export { xxxRepo } from "./yyy"`）も同様の理由で避ける（issue #81）。リネーム・分割時は呼び出し元を一括更新し、シムを残さない

### `components/partials/` ディレクトリ構成

`partials/` 直下は役割ごとに4つのカテゴリに分かれている。新しいコンポーネントを追加するときは、まずどのカテゴリに属するかを判断してから配置する。

```
partials/
├── features/   # 特定の1ページからしか参照されないページ専用コンポーネント
├── common/     # 2つ以上のfeatures/ページから再利用される共有コンポーネント
├── modal/      # ダイアログ・モーダル系コンポーネント
└── shell/      # ページ全体の殻（認証ガード、レイアウト、プロフィール殻等）
```

- **features/**: 対応する`src/pages/`配下のページ1つからのみimportされる想定。他のfeatureや`common/`からimportされてはいけない
- **common/**: 複数のfeatureやshellから再利用されるコンポーネント。単一目的の小さいコンポーネントはそのまま`common/ComponentName/`、関連する複数コンポーネントをまとめる場合は`common/PurposeName/SubComponent/`のように目的名でラップする（例: `common/Auth/`, `common/Charts/`, `common/ListControls/`）
- **modal/**: `<Dialog>`等を伴うモーダル・ポップアップ系
- **shell/**: `RequireAuth`, `DashboardLayout`, `ProfileLayoutShell`など、ページの外枠・ゲート処理を担うコンポーネント
- あるコンポーネントが「features/にいるべきか、common/にいるべきか」迷ったら、実際にimportしている箇所を`grep`で確認し、自分のページ以外から参照されているかどうかで判断する

### `components/partials/` ファイル規則

各カテゴリの中でも、コンポーネントは**必ずフォルダ単位**で管理する。単体の `機能名.tsx` は作らない。

```
common/FeatureName/         # 機能名フォルダ（必須）
    ├── index.tsx         # ロジック含む（データフェッチ、状態管理等）
    ├── ui.tsx            # 純粋なUI関数のみ（副作用なし）
    ├── skeleton.tsx      # スケルトンUI（任意）
    └── errors.tsx        # エラー表示（任意）
```

- 共通化可能な汎用ロジックは `/utils` または `/services`、型定義は `/types` に格納
- UI のみのコンポーネントでも必ずフォルダを作り `index.tsx` に配置（`ui.tsx` に分離するかはロジックの有無で判断）
- この規則は主に「他の機能から再利用される独立したコンポーネント」を対象とする。あるフォルダの `index.tsx`/`ui.tsx` を読みやすくするために内部でのみ使う分割ファイル（例: `AdvancedFilter/BpmSection.tsx` のような private なセクション分割）はそのフォルダ内に置いてよく、個別にフォルダ化する必要はない
- 2つ以上のコンポーネントで見た目や構造(モーダルの殻、カードのレイアウト等)が重複したら、それらの最も近い共通の親フォルダ直下に共有プレゼンテーション用コンポーネントとして切り出し、差分だけを `children` / props で渡す。複数の**feature**をまたいで再利用される場合は `partials/` 直下や `common/` に、単一feature内の複数コンポーネントで再利用される場合はそのfeatureフォルダ直下に置く（例: `features/Import/`配下の複数モーダルで共有される`features/Import/ResultModalShell/`）

### Props設計

- 1つのコンポーネントが複数の独立した機能領域(タブ、セクション等)を扱う場合、フラットなpropsを並べるのではなく機能単位でオブジェクトにグルーピングする（例: `score: ScoreImportProps` / `tower: TowerImportProps`）。目安として1コンポーネントのpropsが10個を超えたらグルーピングを検討する

## Git運用

- GitHub issueに紐づく作業をコミットするときは、1 issue = 1 commit を徹底する。複数issueにまたがる変更を1つのcommitにまとめない
- コミットメッセージ本文に `Refs #<issue番号>`（作業中）または `Closes #<issue番号>`（そのcommitで完了する場合）を含め、GitHub上でissueとcommitが自動的に紐づくようにする
- `git add` で意図しないファイルまで巻き込まないよう、対象issueに関係するファイルだけを明示的に指定してstageする（`git add -A`/`git add .` は使わない）
- issueをcloseするのは、対応するcommitが作成され、GitHub上でissueとの関連付け(コミットメッセージ内の `#<issue番号>` 参照)が確認できてから

## よく参照する型

- `Song`, `Score`, `User`, `AllScores` → `src/types/db.ts`
- `IBpiBasicSongData` → `src/types/songs/bpi.ts`
- IIDXバージョン → `src/types/iidx/version.ts`
- 難易度 → `src/types/iidx/difficulty.ts`
