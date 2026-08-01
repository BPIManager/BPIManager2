# BPIManager2

## プロジェクト概要

beatmania IIDXのスコア管理Webアプリ。Next.js (App Router **ではなく** Pages Router) + TypeScript + Tailwind CSS v4 + shadcn/ui。DBはMySQL (Kysely ORM)、認証はFirebase Auth。

セットアップ・コマンド一覧・ディレクトリ構成は [README.md](README.md) を参照。

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

## 詳細ルール（`.claude/rules/`）

該当パスを触るファイルが開かれると自動で読み込まれる。どの状況でどのファイルが効くかの一覧:

- `coding-conventions.md` — 全般のコーディング規約（常時読み込み）
- `db-layer.md` — `src/lib/db/`・`src/pages/api/`・`src/lib/mcp/tools/`・`src/lib/cron/` を触るとき
- `components.md` — `src/components/` を触るとき
- `git-workflow.md` — commit作成・issueとの紐付けのとき（常時読み込み）
- `issue-driven-development.md` — issue駆動開発の運用（`spec-ready`ラベル等、常時読み込み）
