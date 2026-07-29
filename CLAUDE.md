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
- UI部品はshadcn/ui (`src/components/ui/`)を優先利用
- Kyselyクエリは `src/lib/db/[ドメイン]/index.ts` に集約
- SWRフックは `src/hooks/[ドメイン]/` に配置、フェッチャーは `src/services/swr/` に分離
- `src/constants/radars/topElements.json` (~95KB) は大きいので直接読まない
- 新しいDB参照クエリを書くときは既存のDBスキーマ(`migrations/schema.sql`)を確認し、インデックスが最適化どうかを確認すること。可能であれば、既存のインデックスで高速なクエリを書くように努める。
- 複数テーブルにまたがる書き込み(バッチ削除等)を実装するときは、各テーブルへのクエリはそのテーブルを所有するドメインリポジトリ(`src/lib/db/[ドメイン]/index.ts`)のメソッドとして実装し、他ドメインのテーブルへ直接クエリを書かない。トランザクションを開始する側は`db.transaction().execute(trx => ...)`で各ドメインのメソッドを呼び出す**オーケストレーション役**に徹する。各メソッドは第一引数に`trx: Transaction<Database>`を受け取り、呼び出し元のトランザクションに参加できるようにする(例: [`src/lib/db/scores/index.ts`](src/lib/db/scores/index.ts)の`deleteByBatch`、[`src/lib/db/logs/navigation.ts`](src/lib/db/logs/navigation.ts)の`deleteBatch`)。

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
- 2つ以上のコンポーネントで見た目や構造(モーダルの殻、カードのレイアウト等)が重複したら、共通の親コンポーネント配下ではなく `partials/` 直下に共有プレゼンテーション用コンポーネント（例: `ResultModalShell/`）として切り出し、差分だけを `children` / props で渡す

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
