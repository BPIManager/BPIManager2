# API v1 から v2 への移行ガイド

BPIManager2 の API v1（`/api/v1/*`）は **2027-01-01 に廃止**します。v2（`/api/v2/*`）へ移行してください。

このガイドは、API を利用している外部の開発者向けです。移行手順と、リクエスト・レスポンスの具体的な変更点を示します。

## スケジュール

| 日付（日本時間） | 内容 |
|---|---|
| 2026-11-19 | v1 を非推奨にする。v1 のすべてのレスポンスに `Deprecation`・`Sunset`・`Link` ヘッダーを付ける |
| 2027-01-01 0:00 | v1 を廃止する。以降、v1 のすべてのルートは `410 Gone` を返す |

告知から廃止まで、約 6 週間です。年末年始を挟みますので、早めに移行してください。

## 変更点のまとめ

v2 のパス・リクエストパラメータ・リクエストボディ・認証は、v1 と同じです。**変わるのは、レスポンスの形式です。**

あわせて、パラメータの検証が厳密になりました。たとえば、ID のパラメータ（`songId` など）に `12abc`・`1.5`・`0` のような値を渡すと、400 になります（正の整数だけが有効です）。

| 項目 | v1 | v2 |
|---|---|---|
| パス | `/api/v1/...` | `/api/v2/...`（同じパス。v1 の全ルートに対応するルートがあります） |
| 成功レスポンス | 本文そのもの | `body` に入れた共通の形式（エンベロープ） |
| エラーレスポンス | `{ "message": "..." }` | `{ "error": true, "errorMessage": "...", "body": null, "errorDetails": null }`（認証・405・429 のエラーも同じ形式） |
| 成功時のステータスコード | エンドポイントにより 200 / 201 / 204 | 常に 200 |
| 400 の詳細 | メッセージのみ | 一部のエンドポイントで、不正なパラメータとスキーマを `errorDetails` に返す（詳細が無いときは `null`） |
| 認証 | 変更なし | 変更なし |

## 移行手順

1. **パスを置き換える**: `/api/v1/` を `/api/v2/` に置き換えます。クエリパラメータとリクエストボディは、そのまま使えます。
2. **成功レスポンスを `body` から読む**: これまでレスポンス本文を直接使っていた箇所を、`response.body` に変更します。`error` が `false` であることも確認してください。
3. **エラーの判定を直す**: エラーの判定は、**HTTP ステータスコード**（または `error` が `true`）で行ってください。メッセージは `errorMessage` に入ります（下記「エラーレスポンス」を参照）。
4. **201 / 204 を前提にしていないか確認する**: v2 は成功時に常に 200 を返し、本文があります（下記「成功時のステータスコード」を参照）。
5. **ヘッダーを確認する**: v1 のレスポンスに付く `Deprecation`・`Sunset`・`Link` ヘッダーで、非推奨の状態と、移行先を確認できます。
6. **動作確認後に切り替える**: 開発環境で v2 を呼んで、期待どおりの値が取れることを確認してから、本番を切り替えてください。

## 変更点の詳細

### 成功レスポンス

v2 は、すべての成功レスポンスを次の形式にします。

```json
{
  "error": false,
  "errorMessage": null,
  "body": { ... },
  "errorDetails": null,
  "meta": { "viewerId": "...", "isSelf": false }
}
```

- `body`: v1 のレスポンス本文と同じ内容です（形は変わりません）。
- `errorDetails`: 成功時は常に `null` です。
- `meta`: 一部のエンドポイントだけに含まれます（`viewerId`: 閲覧者のユーザー ID、`isSelf`: 閲覧対象が閲覧者自身か）。
- 画像を返すエンドポイント（OGP 画像など）は、成功時に画像そのものを返します。エラー時は、下記のエンベロープです。

**例**: `GET /api/{v}/users/{userId}/scores?version=34`

v1:

```json
[
  { "songId": 1024, "title": "V", "difficulty": "ANOTHER", "exScore": 2805, "bpi": 52.45 }
]
```

v2:

```json
{
  "error": false,
  "errorMessage": null,
  "body": [
    { "songId": 1024, "title": "V", "difficulty": "ANOTHER", "exScore": 2805, "bpi": 52.45 }
  ],
  "errorDetails": null,
  "meta": { "viewerId": null, "isSelf": false }
}
```

### エラーレスポンス

HTTP ステータスコード（400・403・404・500 など）は、v1 と同じです。本文の形式が変わります。

v1:

```json
{ "message": "Song not found" }
```

v2:

```json
{
  "error": true,
  "errorMessage": "Song not found",
  "body": null,
  "errorDetails": null
}
```

認証のエラー（401・403）、メソッドが許可されていない（405）、リクエスト数の制限（429）、サーバー内部のエラー（500）も、同じ形式です。`errorDetails` は、詳細が無いとき `null` です（キーは常に存在します）。

### 400（パラメータ不正）の詳細

v2 では、一部のエンドポイントで、400 に `errorDetails` が付きます。どのパラメータがなぜ不正か（`issues`）と、受け付けるパラメータの JSON Schema（`schema`）です。`errorMessage` は v1 と同じです。

```json
{
  "error": true,
  "errorMessage": "Required parameters are missing",
  "body": null,
  "errorDetails": {
    "in": "query",
    "issues": [
      { "path": ["level", "difficulty"], "code": "missing_parameters", "message": "At least one of level or difficulty is required" }
    ],
    "schema": { "type": "object", "properties": { "level": { ... }, "difficulty": { ... } }, "anyOf": [ ... ] }
  }
}
```

`errorDetails` に内容が入るのは、パラメータの検証を行っているエンドポイントです。それ以外のエラーでは `null` です。`issues` と `schema` の内容は、英語です。

### 成功時のステータスコード

v1 で 201 または 204 を返していたエンドポイントは、v2 では **200 を返し、本文があります**。ステータスコードが 201 や 204 であることを前提にしている場合は、修正してください。

| エンドポイント | v1 | v2 |
|---|---|---|
| `POST /follow-requests` | 201 | 200 |
| `POST /songs/{songId}/notes` | 201 | 200 |
| `POST /users/{userId}/follow-lists` | 201 | 200 |
| `POST /users/{userId}/optimizeMemo` | 201 | 200 |
| `DELETE /songs/{songId}/notes/{noteId}` | 204（本文なし） | 200（`body` は `{ "deleted": true }`） |
| `DELETE /users/{userId}/optimizeMemo/{memoId}` | 204（本文なし） | 200（`body` は `{ "deleted": true }`） |
| `DELETE /oauthClient` | 204（本文なし） | 200（`body` は `{ "deleted": true }`） |

### 認証

変更はありません。v1 で使っていた認証方式（`Authorization` ヘッダー、API キー）を、そのまま使えます。

### v2 だけにあるエンドポイント

v2 には、v1 に無いエンドポイントがあります（月間レビュー、保存した比較、フォローリストの閲覧権限、都道府県別ランキング、BPI オプティマイザの分析など）。一覧は API ドキュメントを参照してください。

### v2 だけの機能

- `GET /api/v2/bpi/calc` に、BPI の計算モデルを選ぶ `model=v1|v2|both` を追加しました（省略時は `v2`）。`both` のときは、`body.models` に V1 と V2 の両方の値が入ります。
- INFINITAS 表記の曲名が完全一致しないとき、`/api/v2/bpi/calc` は、対応表に載っている曲名に限って、アーケード表記に直して計算し、`body.warnings` に補正内容を返します。

## 非推奨・廃止を知らせるヘッダー

v1 のすべてのレスポンスに、次のヘッダーが付きます。

| ヘッダー | 値の例 | 意味 |
|---|---|---|
| `Deprecation` | `@1795014000` | v1 を非推奨にした日時（RFC 9745。UNIX 秒） |
| `Sunset` | `Thu, 31 Dec 2026 15:00:00 GMT` | v1 の廃止日時（RFC 8594。日本時間で 2027-01-01 0:00） |
| `Link` | `</api/v2/users/.../scores>; rel="successor-version"` | 同じパスの v2 |
| `Link` | `<このガイドの URL>; rel="deprecation"` | 移行ガイド |

## コード例（TypeScript）

v2 のレスポンスから `body` を取り出す関数の例です。

```ts
type ApiResponse<T> = {
  error: boolean;
  errorMessage: string | null;
  body: T | null;
  meta?: { viewerId: string | null; isSelf: boolean };
  errorDetails: unknown | null;
};

async function getV2<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json().catch(() => null)) as
    | Partial<ApiResponse<T>>
    | null;

  // エラーは HTTP ステータスと error で判定する
  if (!res.ok || !json || json.error) {
    throw new Error(json?.errorMessage ?? `HTTP ${res.status}`);
  }
  return json.body as T;
}

// 使い方
const scores = await getV2<Score[]>(
  "https://<サイトのURL>/api/v2/users/abc123uid/scores?version=34",
);
```

## 廃止後の挙動

2027-01-01 0:00（日本時間）以降、v1 のすべてのルートは `410 Gone` を返します。本文には、v2 への移行先とこのガイドの URL を含めます。

## 問い合わせ

移行について不明な点は、BPIManager2 の問い合わせ窓口にお知らせください。
