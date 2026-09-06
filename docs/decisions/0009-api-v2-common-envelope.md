# 0009: API v2 共通レスポンスエンベロープの型・移行方式

- **ステータス**: 採用
- **記録日**: 2026-09-06
- **対応issue**: #305

## 背景

`src/pages/api/` 配下の全APIエンドポイント（102ファイル、うち `v1/users/[userId]/` 配下だけで約60ファイル）は共通のレスポンスラッパーを持たず、成功時のレスポンス形状がエンドポイントごとにバラバラである（配列を生データのまま返す / 単発オブジェクトを返す等が混在）。エラー時も `withUserApiHandler` 経由の一部は `{ message: string }` に揃っているが、素の `try-catch` で独自形式を返すエンドポイントも多い。クライアント側（`src/services/swr/`・`src/utils/common/fetch.ts`）は `res.json()` をunwrapせずそのまま SWR の `data` として使っているため、レスポンス形状のばらつきがそのままクライアント側の型・実装のばらつきに直結している。

全エンドポイントで厳密に共通の型を持つレスポンスエンベロープを `/api/v2/` として導入する。選択肢の比較・現状調査の詳細は提案書 `docs/proposals/api-v2-common-envelope.md`（本決定記録の採用に伴い削除）にあった内容を以下に要約する。

## 検討した選択肢（移行方式）

| 案 | 概要 | 却下理由 |
|---|---|---|
| A: 一括移行（flag day） | `/api/v1/` を `/api/v2/` へ即座に全面置換 | 102ファイル + 全SWR消費側を1PRで書き換える必要があり検証・ロールバックのリスクが過大 |
| B: エンドポイント丸ごと複製し並行稼働 | `/api/v2/` を新設しハンドラ実装をv1/v2で複製 | ロジックが同一なのに実装を複製し、片方だけ修正されるバグ・保守コストを招く。現状ハンドラはロジックと `res.json()` が未分離のため複製は実質ハンドラ全体の複製になる |
| C: バージョンを分けず `v1` のまま統一 | 既存 `v1` 配下の形状のみ段階的に統一 | 同一バージョン内で新旧形状が混在し、呼び出し側から見分けがつかない。破壊的変更が外部から見えず事故りやすい |
| **D: ハンドラを「結果を返す」形にリファクタし v1/v2 は薄いアダプタのみ分ける** | ロジック本体を正規化結果を**返す**形に統一し、`res.status().json()` を呼ぶのはv1/v2アダプタのみ | （採用） |

## 結論

### 1. 移行方式は D 案を採用

ビジネスロジックのハンドラ本体を「正規化された結果を返す」形に統一する一次リファクタを先に行い、実際に `res` へ書き込むのはv1アダプタ（現行形式）・v2アダプタ（エンベロープ形式）という薄いラッパー層のみとする。ハンドラ本体はv1/v2で完全に共有し、ロジックの複製を発生させない。

### 2. エンベロープ型（`src/types/api.ts` に集約）

```ts
export interface ApiMeta {
  /** アクセス制御由来: 閲覧者のuserId（未ログインは null） */
  viewerId: string | null;
  /** アクセス制御由来: 閲覧対象が閲覧者自身か */
  isSelf: boolean;
  /** 一覧系エンドポイントのページネーション情報（該当時のみ） */
  pagination?: {
    total: number;
    page: number;
    perPage: number;
    hasNext: boolean;
  };
}

export interface ApiResponse<T> {
  /** 成否フラグ。true のとき body は null、errorMessage は非 null */
  error: boolean;
  errorMessage: string | null;
  body: T | null;
  meta?: ApiMeta;
}
```

- `body` はエンドポイントごとにジェネリクス `ApiResponse<T>` で型付けする（`any` 固定にしない）。型定義自体は `src/types/api.ts` の1箇所に集約する。
- `meta` は最初から `viewerId` / `isSelf`（現状 `src/lib/subhandlers/userId-profile.ts` で個別実装）と、一覧APIを見越した `pagination` の型枠を持つ。実データを載せるかはエンドポイント単位で判断する。
- `meta` に載せたい値が増えた場合は `ApiMeta` にフィールドを追加する（後方互換のためオプショナルで追加）。

### 3. 正規化された結果型（ハンドラの戻り値）

```ts
export type HandlerResult<T> =
  | { ok: true; body: T; meta?: Partial<ApiMeta> }
  | { ok: false; status: number; message: string };
```

- v1アダプタ: `ok` なら現行と同じ生形状（`res.status(200).json(body)` 等）で書き込む。`!ok` なら `res.status(status).json({ message })`。
- v2アダプタ: `ok` なら `res.status(200).json({ error: false, errorMessage: null, body, meta })`。`!ok` なら `res.status(status).json({ error: true, errorMessage: message, body: null })`。
- エラー種別（404 / 403 / 500 等）は `status` の数値で表現する。専用のエラーコード enum は導入しない（既存の実装量に対して過剰なため）。

### 4. HTTPステータスコードは従来通り維持

`error: boolean` を body に持たせるが、HTTPステータスコード（4xx/5xx）は引き続き正しく返す。常時200方式には寄せない（既存の193箇所に及ぶステータスコード判定コードへの影響を避けるため）。

### 5. SWR は v2専用フェッチャーを新設

`src/utils/common/fetch.ts` の `fetcher` / `authFetch` はv1のまま据え置く。v2用に、エンベロープを検証して `body` をunwrapし `error: true` のとき throw する新フェッチャーを別途追加する。移行途中はv1エンドポイントとv2エンドポイントをフェッチャーの種類で明示的に分離する。

### 6. subissue はドメイン単位で分割

「ハンドラの結果返却リファクタ + v2アダプタ + SWRフェッチャー/フックのv2切り替え」を1つのドメイン単位 subissue に含める。着手時に都度起票し #305 本文のタスクリストへ追記する。ドメインの区切りは #305 本文を参照。`stats/`（約25ファイル）のように1ドメインが大きすぎる場合は、その中でさらに分割してよい（issue-driven-development.md の粒度基準に従う）。

## スコープ外

- 個別ドメインの `/api/v2/` 移行実装そのもの（#305 の子issueとして個別起票）
- `/api/v1/` の廃止・削除（全ドメイン移行完了後に別途判断）
- `pages/api/mcp.ts`・`pages/api/oauth/*` 等、SWRから消費されない非RESTエンドポイントの扱い（移行対象に含めるか含めないかは各ドメイン着手時に判断）
