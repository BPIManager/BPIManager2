# BPI Manager 2 — Claude Code ガイド

## プロジェクト概要

beatmania IIDX の BPI（Beat Power Indicator）スコアを管理・分析する Next.js Web アプリケーション。
スコアのインポート、ダッシュボード表示、ライバル比較、ソーシャル機能などを提供する。

## 技術スタック

| レイヤー     | 技術                                                                  |
| ------------ | --------------------------------------------------------------------- |
| Framework    | Next.js 16（Pages Router）                                            |
| 言語         | TypeScript                                                            |
| UI           | shadcn/ui (Radix UI), Tailwind CSS v4, Recharts, Lucide React, Sonner |
| DB           | MySQL 8.0（Kysely クエリビルダー経由）                                |
| 認証         | Firebase Authentication                                               |
| バックエンド | Firebase Admin SDK                                                    |
| データ取得   | SWR                                                                   |
| Cron         | node-cron                                                             |
| テスト       | Vitest                                                                |

## ディレクトリ構成

```
BPIManager2/
├── src/
│   ├── pages/          # Next.js Pages Router エントリ
│   ├── components/
│   │   └── partials/   # ページごとの UI コンポーネント（Feature単位で分割）
│   │       ├── AllSongs/
│   │       ├── Analytics/
│   │       ├── DashBoard/
│   │       └── ...
│   ├── hooks/          # SWR + ロジックを持つカスタムフック（Feature単位）
│   │   ├── allScores/
│   │   ├── analytics/
│   │   ├── batches/
│   │   ├── common/
│   │   └── ...
│   ├── lib/
│   │   ├── bpi/        # BPI 計算ロジック
│   │   ├── cron/       # 定期ジョブ（サイトマップ/Arena/Radar）
│   │   ├── db/         # Kysely を使った DB アクセス層（Feature単位）
│   │   ├── dayjs/      # dayjs 設定
│   │   └── firebase/   # Firebase 初期化・Admin SDK
│   └── types/          # 共通型定義
├── migrations/
│   └── schema.sql      # MySQL スキーマ定義（単一ファイル）
├── public/             # 静的ファイル・PWA マニフェスト
├── .env.example        # 環境変数テンプレート
└── package.json
```

## よく使うコマンド

```bash
# 開発サーバー（HTTPS 必須 — Firebase Auth のため）
npm run dev

# ビルド
npm run build

# テスト（Vitest）
npm test
npm run test:ui    # UI モードで実行

# Lint
npm run lint
```

> **注意**: `npm run dev` は `--experimental-https` フラグ付き。  
> ローカルで HTTPS 証明書が必要（Next.js が自動生成する）。

## 環境変数

`.env.example` を `.env.local` にコピーして全項目を埋める。

```bash
cp .env.example .env.local
```

| 変数名                                       | 用途                                 |
| -------------------------------------------- | ------------------------------------ |
| `BASEURL`                                    | アプリのベース URL                   |
| `DB_DATABASE`, `DB_HOST`, `DB_USER`, `DB_PW` | MySQL 接続情報                       |
| `DATABASE_URL`                               | Kysely 用接続 URL                    |
| `FIREBASE_*`                                 | Firebase Admin SDK 認証情報（9項目） |

## コーディング規約

### コンポーネント設計

- `src/components/partials/<Feature>/` に機能単位でまとめる
- UI ロジックは `hooks/` に切り出し、コンポーネントは表示のみに専念する
- `index.tsx` がエントリ、`ui.tsx` が純粋な表示、`skeleton.tsx` がローディング状態
- shadcn/ui のコンポーネントを優先的に使用する

### データ取得

- クライアントサイドのデータ取得は SWR（`useSWR`）を使う
- DB アクセスは必ず `src/lib/db/<Feature>/index.ts` 経由で行う（Kysely）
- 直接 SQL を書かず、Kysely のクエリビルダーを使う

### 型定義

- 共通型は `src/types/` に置く
- `kysely-codegen` で DB スキーマから型を自動生成できる（`DATABASE_URL` が必要）

### テスト

- `vitest` を使用（Jest 互換 API）
- テストファイルは対象ファイルと同ディレクトリまたは `__tests__/` フォルダに配置

### スタイリング

- Tailwind CSS v4 を使用（設定は `postcss.config.mjs`）
- `tailwind-merge` + `clsx` でクラス名を管理（`cn()` ユーティリティ）
- ダークモード対応（`next-themes`）

## DB スキーマ変更時

`migrations/schema.sql` を更新してから MySQL に直接適用する（マイグレーションツールなし）。  
型定義の再生成が必要な場合は：

```bash
npx kysely-codegen
```

## Cron ジョブ

`src/lib/cron/job.ts` で定義。サーバー起動時に自動登録される。

| ジョブ               | スケジュール   | 処理             |
| -------------------- | -------------- | ---------------- |
| サイトマップ生成     | 毎日 02:00 UTC | `cron/sitemaps/` |
| Arena JSON 生成      | 毎日 04:00 UTC | `cron/metrics/`  |
| Radar キャッシュ更新 | 12時間ごと     | `cron/radar/`    |

## Firebase 認証フロー

- クライアント: Firebase Authentication SDK でログイン
- サーバー: `firebase-admin` で ID トークンを検証
- `src/lib/firebase/` に初期化コードが集約されている

## よくある作業パターン

### 新しい API Route を追加する

1. `src/lib/db/<Feature>/index.ts` に DB クエリ関数を追加
2. `src/pages/api/<feature>/[...].ts` に Route Handler を作成
3. `src/hooks/<feature>/use<Feature>.ts` に SWR フックを作成
4. コンポーネントからフックを呼び出す

### 新しいコンポーネントを追加する

1. `src/components/partials/<Feature>/` ディレクトリを作成
2. `index.tsx`（ロジック）→ `ui.tsx`（表示）→ `skeleton.tsx`（ローディング）の順に実装
3. shadcn/ui のコンポーネントを活用する

### shadcn/ui コンポーネントを追加する

```bash
npx shadcn@latest add <component-name>
```
