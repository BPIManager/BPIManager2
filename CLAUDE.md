# BPIManager2

## プロジェクト概要

beatmania IIDXのスコア管理Webアプリ。Next.js (App Router **ではなく** Pages Router) + TypeScript + Tailwind CSS v4 + shadcn/ui。DBはMySQL (Kysely ORM)、認証はFirebase Auth。

コーディング規約・ディレクトリ別の詳細ルールは `.claude/rules/` に分割されている。関連ファイルを開くと自動的に読み込まれるので、ここには常時必要な概要のみを置く。

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
│   ├── partials/   # ページ固有・共有の複合コンポーネント（詳細は .claude/rules/components.md）
│   └── ui/         # shadcn/ui ベースの汎用UIコンポーネント
├── hooks/          # SWRフェッチ + ローカル状態ロジック（ドメイン別サブディレクトリ）
├── lib/
│   ├── bpi/        # BPI計算ロジック（BpiCalculator クラス）
│   ├── db/         # Kyselyクエリ（ドメイン別サブディレクトリ、詳細は .claude/rules/db-layer.md）
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

## よく参照する型

- `Song`, `Score`, `User`, `AllScores` → `src/types/db.ts`
- `IBpiBasicSongData` → `src/types/songs/bpi.ts`
- IIDXバージョン → `src/types/iidx/version.ts`
- 難易度 → `src/types/iidx/difficulty.ts`
