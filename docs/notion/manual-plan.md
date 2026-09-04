# BPIM2 ユーザーマニュアル整備 — 執筆方針

> このディレクトリは、Notion 上の「BPIM2 ヘルプページ」配下にユーザー向け使い方マニュアルを
> 整備する作業の方針・進捗を管理するためのもの。作業が中断しても `progress.md` を見れば再開できる。

## 1. ゴール

Notion「🛖 BPIM2でできること」ページに書かれたサンプルのアウトライン（ドキュメント割り）に沿って、
未執筆のマニュアルページを**すべて執筆・公開**する。既存の完成済みサンプル2ページと同等の粒度・体裁で揃える。

## 2. 参照元（Notion）

| ページ | URL / ID | 役割 |
|---|---|---|
| BPIM2 ヘルプページ（ルート） | `3239989ca87a809f8058dc9736f0e197` | ヘルプ全体の親 |
| 🛖 BPIM2でできること（インデックス） | `32a9989ca87a80829561f4b9618f1d6f` | **今回完成させる対象**。アウトライン兼目次 |
| 📊 ダッシュボード（完成サンプル） | `32a9989ca87a800680b5c2ff3f7818ad` | 体裁の手本① |
| 👥 プレイヤーをフォロー/アンフォロー/強制フォロー解除する（完成サンプル） | `3bd9989ca87a80cab3c2f2fc7584abf3` | 体裁の手本② |

新規ページはすべて「🛖 BPIM2でできること」の**子ページ**として作成し、インデックス本文の該当プレーンテキスト行を
`<page>` リンクに差し替える。

## 3. アプリ情報

- ローカル起動: `https://localhost:3001`（`next dev --experimental-https` のため **https**。証明書は自己署名）
- 既存 Chrome（プロファイル `C:\Users\admin\AppData\Local\Google\Chrome\User Data` / `Default`）にログイン済み
- 本番: `https://bpi2.poyashi.me`（ドキュメント本文中のリンクは本番URLを使う。サンプルに準拠）

## 4. 体裁・スタイルガイド（サンプル2ページから抽出）

- **言語**: 日本語。です・ます調。
- **ページ先頭**: 1〜2文の導入（そのページで何ができるか）。`<br>` で改行可。
- 導入の直後に **目次**（`<table_of_contents>` / Notion の「目次」ブロック）。`---` 区切りを多用。
- **見出し**: `##` = 大セクション（「1. ライバルを探す」等、番号付きも可）、`###` = 小セクション、`####` = さらに細分。
- **操作説明**: 「操作」「内容」の2列テーブルを使う（ダッシュボードのフィルターバー等）。
  手順が直線的なものは箇条書き + 太字でボタン名を示す。
- **画像**: 引用（callout/quote）ブロックの中に画像を1枚入れる形（サンプル準拠）。各セクションに関連スクショを1枚。
- **強調**: ボタン名・トグル名・タブ名は `**太字**`。重要な注意は文中で `**...**`。
- **相互リンク**: 関連する他マニュアルページ・アプリ内URL（本番）へ積極的にリンク。
- **末尾**: 必要に応じて `## FAQ`（Q. / A. 形式、フォローページ準拠）。
- ページ icon は内容に合った emoji を1つ設定（ダッシュボード=📊, フォロー=👥 等）。
- コード的な UI 文字列（バージョン名 `RESIDENT` 等）はそのまま地の文に埋め込む。

## 5. アプリのナビゲーション構造（現行 / `src/components/partials/common/Sidebar/`）

```
ご支援のお願い            /support
ダッシュボード            /
インポート               /import
── スコア一覧
   プレイ済み            /my/{version}
   未プレイ              /my/unplayed/{version}
スコア更新ログ            /users/{userId}/logs/{version}
── ライバル
   ライバル一覧          /rivals
   タイムライン          /timeline
   ライバルを探す        /rivals/search
   全体ランキング        /ranking/global
── 分析
   比較                 /analytics
   AAA達成難易度表       /metrics/AAADifficultyTable
   アリーナランク平均     /metrics/arenaAverage/{version}
── ベータ版機能
   アシスタント          /optimizer
   楽曲情報             /songs
   全曲（☆10以下含む）   /my/all/{version}
   ランダムレーンチケット /tickets
── 関連情報
   APIリファレンス / MCP Server / GitHub / ヘルプページ / 更新履歴 / 不具合・要望の報告 / Xでフォロー / 統計情報(/info/stats)
設定                    /settings
```

## 6. 作成するページ一覧（インデックスのアウトライン準拠）

サンプルのアウトライン:

```
## はじめに
  BPIとは?
  アカウントを登録する
  データを登録する
## 各ページの使い方
  ダッシュボード                         ← 完成済み
  スコア一覧（プレイ済み/未プレイ）
  スコア更新（スコアログを追加/更新履歴を確認/削除）
  ソーシャル
  プレイヤーをフォロー/アンフォロー/強制フォロー解除する  ← 完成済み
  比較
  指標
  設定
  ベータ版機能（アシスタント/楽曲情報/全曲データ）
```

「スコア更新」と「ベータ版機能」は入れ子項目を**1ページ内の `##` セクション**として扱う（ダッシュボードのサブセクション処理に準拠）。
→ **新規10ページ + インデックス改訂**。

各ページの内訳は `page-plan.md` を参照。

## 7. Notion 実装メカニクス

- ページ作成: `notion-create-pages`（parent = `page_id: 32a9989ca87a80829561f4b9618f1d6f`）。
  1呼び出しにつき1ページ（本文が長いので個別に）。`icon` に emoji、`properties.title` にタイトル。
- 目次ブロック等の記法は `notion://docs/enhanced-markdown-spec` を作業前に確認する。
- 画像添付フロー:
  1. `notion-create-file-upload`（filename）→ `upload_url` / `upload_headers` を取得
  2. その URL に multipart POST（`file` フィールド、返却ヘッダ全付与）— `scripts/upload-notion-image.mjs` を使う
  3. 返却された `markdown_source` / `suggested_markdown` を本文の画像位置に埋め込む
- インデックス改訂: `notion-update-page`（command `update_content` で該当行を `<page>` リンクへ差し替え）。

## 8. スクリーンショット取得ハーネス

- 事前: **ユーザーが Chrome を一度終了** → こちらで下記により再起動（プロファイル維持＝ログイン維持）:
  ```
  "C:\Program Files\Google\Chrome\Application\chrome.exe" \
    --remote-debugging-port=9222 \
    --user-data-dir="C:\Users\admin\AppData\Local\Google\Chrome\User Data" \
    --profile-directory=Default about:blank
  ```
- 操作: `scratchpad` 配下に `puppeteer-core` をローカル install（プロジェクトの package.json は汚さない）。
  `puppeteer.connect({ browserURL: "http://localhost:9222" })` で接続。
- 各スクショ手順:
  1. `page.goto("https://localhost:3001/...", { waitUntil: "networkidle0" })`（自己署名証明書は `ignoreHTTPSErrors` 相当 / CDP 接続時はプロファイルが既に例外許可済みの想定。必要なら証明書エラーページを実処理）
  2. 必要なら操作（タブ切替、モーダルを開く等）
  3. **ライバル情報のぼかし**: 対象ページで他ユーザー名・アイコンを含む要素に
     `el.style.filter = "blur(5px)"` を注入（下記「ぼかし対象」）。自分のデータはぼかさない。
  4. `page.screenshot()` で PNG を `scratchpad/shots/<page>-<section>.png` に保存
  5. 保存後、目視（Read で画像確認）してぼかし漏れがないか確認 → OK なら Notion アップロード
- 出力先: `C:\Users\admin\AppData\Local\Temp\claude\d--GitHub-bpim2\<session>\scratchpad\shots\`

### ぼかし対象（ライバル＝自分以外のユーザーの識別情報）

| 画面 | ぼかす要素 |
|---|---|
| ダッシュボード | ライバル勝敗サマリーカードのライバル名、ライバル僅差曲表の相手名、レーダー比較の他者名 |
| /rivals, /rivals/search | 提案/一覧の各ユーザーカードの名前・アイコン・IIDX ID |
| /rivals/{userId}, /analytics | 対戦相手の名前・アイコン（列見出し等） |
| /timeline | 自分以外の投稿者名・アイコン |
| /ranking/global | 自分以外の行のユーザー名・アイコン |
| 楽曲詳細モーダル（Rivals タブ） | 他ユーザー名 |
| 通知ベル | 差出人名（フォローリクエスト等） |

自分自身の名前・IIDX ID・スコア・BPI は**ぼかさない**（公開OK）。

## 9. 進め方（中断・再開しやすい順序）

1. `enhanced-markdown-spec` 確認 → 画像なしでも作れる純テキストのページから着手
   （BPIとは / アカウント登録 / 設定 の一部）
2. スクショハーネス準備（ユーザーの Chrome 終了を待つ）
3. 画面ごとに「探索→スクショ→本文執筆→ページ作成→画像添付」を1ページずつ完了
4. 各ページ完成のたび `progress.md` を更新（Notion ページ URL を記録）
5. 全ページ完成後、インデックス「🛖 BPIM2でできること」を改訂してリンク化
6. 完成報告（各 Notion URL 一覧）

## 10. 注意

- `.claude/rules/coding-conventions.md`: Firebase の `displayName` はマニュアル文言でも使わない。ユーザー名は
  `users.userName`（アプリ上でユーザーが設定した表示名）を指す前提で書く。
- 実装挙動が不明な点は、勝手に推測せず該当 feature コンポーネント（`src/components/partials/features/...`）を読んで確認する。
- Notion ページはワークスペースの公開ヘルプに直結するため、断定できない仕様は書かない。
