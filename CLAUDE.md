# BPIManager2

## プロジェクト概要

beatmania IIDXのスコア管理Webアプリ。Next.js (App Router **ではなく** Pages Router) + TypeScript + Tailwind CSS v4 + shadcn/ui。DBはMySQL (Kysely ORM)、認証はFirebase Auth。

## コマンド

```bash
pnpm dev        # 開発サーバー起動 (--experimental-https)
pnpm build      # ビルド
pnpm test       # vitest
pnpm lint       # eslint
```

## ディレクトリ構成

```
src/
├── pages/          # Next.js Pages Router（画面 & API Routes）
│   └── api/v1/     # REST API: /users/[userId]/...
├── components/
│   ├── partials/   # ページ固有の複合コンポーネント
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
- **テスト**: vitest + @testing-library/react、`test/` ディレクトリ

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
- 新しいDB参照クエリを書くときは既存のDBスキーマ(/migration/schema.sql)を確認し、インデックスが最適化どうかを確認すること。可能であれば、既存のインデックスで高速なクエリを書くように努める。

### `components/partials/` ファイル規則

`partials/` 以下のコンポーネントは**必ずフォルダ単位**で管理する。単体の `機能名.tsx` は作らない。

```
partials/
└── FeatureName/          # 機能名フォルダ（必須）
    ├── index.tsx         # ロジック含む（データフェッチ、状態管理等）
    ├── ui.tsx            # 純粋なUI関数のみ（副作用なし）
    ├── skeleton.tsx      # スケルトンUI（任意）
    └── errors.tsx        # エラー表示（任意）
```

- 共通化可能な汎用ロジックは `/utils` または `/services`、型定義は `/types` に格納
- UI のみのコンポーネントでも必ずフォルダを作り `index.tsx` に配置（`ui.tsx` に分離するかはロジックの有無で判断）

## よく参照する型

- `Song`, `Score`, `User`, `AllScores` → `src/types/db.ts`
- `IBpiBasicSongData` → `src/types/songs/bpi.ts`
- IIDXバージョン → `src/types/iidx/version.ts`
- 難易度 → `src/types/iidx/difficulty.ts`
