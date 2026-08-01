---
paths:
  - "src/lib/db/**"
  - "src/pages/api/**"
  - "src/lib/mcp/tools/**"
  - "src/lib/cron/**"
---

# DB層（`src/lib/db/`）の規約

- 新しいDB参照クエリを書くときは既存のDBスキーマ(`migrations/schema.sql`)を確認し、インデックスが最適化どうかを確認すること。可能であれば、既存のインデックスで高速なクエリを書くように努める
- `src/pages/api/`配下（APIルート）・`src/lib/mcp/tools/`・`src/lib/cron/`等の呼び出し元レイヤーで`import { db } from "@/lib/db"`し、Kyselyクエリを直接書くことは禁止。どんなに小さい単一テーブル参照(`db.selectFrom("users").select(...).where("userId","=",userId).executeTakeFirst()`等)でも、対応する`domains/[ドメイン]/index.ts`（複数テーブルに及ぶ場合は`aggregates/`）にメソッドとして追加し、呼び出し元はそのメソッドを呼ぶ。同じクエリ形が2箇所以上に登場したら、新規に書く前に既存メソッドで代替できないか確認する
- 複数テーブルにまたがる書き込み(バッチ削除等)を実装するときは、各テーブルへのクエリはそのテーブルを所有するドメインリポジトリ(`src/lib/db/domains/[ドメイン]/index.ts`)のメソッドとして実装し、他ドメインのテーブルへ直接クエリを書かない。トランザクションを開始する側は`db.transaction().execute(trx => ...)`で各ドメインのメソッドを呼び出す**オーケストレーション役**（`src/lib/db/orchestrators/`）に徹する。各メソッドは第一引数に`trx: Transaction<Database>`を受け取り、呼び出し元のトランザクションに参加できるようにする(例: [`src/lib/db/domains/scores/index.ts`](src/lib/db/domains/scores/index.ts)の`deleteByBatch`、[`src/lib/db/domains/logs/navigation.ts`](src/lib/db/domains/logs/navigation.ts)の`deleteBatch`)

## `src/lib/db/` ディレクトリ構成

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

## 統合ファサードオブジェクトを作らない

`domains/`・`aggregates/`配下の各サブファイル（`tables.ts`/`charts.ts`/`social.ts`のように責務ごとに分けたリポジトリ）を、呼び出し側の利便性のために1つの`xxxRepo`オブジェクトへ再集約する`index.ts`（例: 各メソッドを`.bind()`で束ねるファサード）を新規に作らない。このパターンは一見便利だが、無関係な責務が1ファイルに同居し続ける温床になり、行数が肥大化してから分割 → 呼び出し元更新という手戻り作業（issue #182, #183, #181等）を繰り返し発生させてきた。

- 呼び出し元は分割済みの各リポジトリ（例: `statsTablesRepo`, `statsChartsRepo`, `statsSocialRepo`）を該当ファイルから直接importする
- 1ファイルが責務ごとに分割された場合、集約用の`index.ts`は作らずに削除し、呼び出し元のimportを分割後の各ファイルへ直接向ける
- 後方互換のためだけの再export（`export { xxxRepo } from "./yyy"`）も同様の理由で避ける（issue #81）。リネーム・分割時は呼び出し元を一括更新し、シムを残さない
