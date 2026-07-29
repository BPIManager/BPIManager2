# テストコードの構成

## フォルダ構成

```
test/
├── unit/
│   ├── db/         # dbをモックしてクエリ組み立て・変換ロジックを検証するリポジトリテスト
│   ├── logic/      # DBに触れない純粋関数・サービスロジックのテスト
│   └── helpers/    # unit配下で共通利用するスパイ等(dbQuerySpy.ts等)
├── integration/   # 起動中のサーバーや実DBなど、外部システムに依存するテスト
├── resources/      # unit/integration 共通のフィクスチャ(CSV・JSON等)
└── setup.ts        # vitest 共通セットアップ(@testing-library/jest-dom 等)
```

`test/unit/` に新しくテストを追加するときは、`vi.mock("@/lib/db", ...)` 等でDBをモックしてクエリ組み立てを検証するものは `db/`、DBに触れない純粋関数やサービスロジックのテストは `logic/` に置く。

テストは「一度動作確認したら消すスクリプト」ではなく、**将来のリグレッションを検知するために恒久的に残す資産**です。追加したら基本的に削除しません。

## unit と integration の使い分け

| | unit | integration |
|---|---|---|
| 対象 | 純粋関数・ロジック・DBリポジトリ(モック使用) | API Routes・実DBアクセス・外部API連携 |
| 依存 | なし(vitest単体で完結) | 起動中のdevサーバー、実DB接続、実Firebaseなど |
| 実行速度 | 速い | 遅い・不安定(外部要因で落ちうる) |
| 実行タイミング | 常に(コミット前・CI) | 手動、または専用CIジョブ |

- DBアクセスを含むロジックでも、`db.transaction()`や`trx`をモック/スタブして外部接続なしで検証できるものは **unit**([test/unit/deleteBatch.test.ts](unit/deleteBatch.test.ts)が例)
- 実際にHTTPリクエストを飛ばして認証フローやAPI Routeの応答を検証するものは **integration**([test/integration/apiKey.test.ts](integration/apiKey.test.ts)が例)。事前に`pnpm dev`でサーバーを起動し、`TEST_API_KEY`・`TEST_USER_ID`等の環境変数を用意する必要がある

新しくテストを書くときは、まず「これは外部システムなしで実行できるか？」を基準にどちらに置くか判断してください。判断に迷う場合は unit を優先し、モックで表現しきれない場合のみ integration にします。

## 実行方法

```bash
pnpm test              # unit + integration すべて実行
pnpm test:unit         # unit のみ(外部システム不要、高速)
pnpm test:integration  # integration のみ(devサーバー起動が前提)
pnpm test:ui           # vitest UI
```

日常的な開発では `pnpm test:unit` で十分です。`pnpm test:integration` はAPI周りを変更したときや、リリース前の確認に使ってください。
