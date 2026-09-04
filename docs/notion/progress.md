# 進捗管理

最終更新: 2026-09-04（ハーネス稼働・A-1完了）

## Notion 親ページ
- 🛖 BPIM2でできること: `32a9989ca87a80829561f4b9618f1d6f`
- 作成済み子ページ:
  - A-1 BPIとは?: https://app.notion.com/p/3d19989ca87a81d9b0edc6b681133d16
  - A-2 アカウントを登録する: https://app.notion.com/p/3d19989ca87a81f1b41fcff5c8a2bdc1
  - A-3 データを登録する: https://app.notion.com/p/3d19989ca87a8159a628ee0368618ded
  - B-6 設定: https://app.notion.com/p/3d19989ca87a811b9477f9a7d7368b6d

## userId / version
- userId: jUQzY1Y05pfdVIF06AWTFsxPuDH2
- 表示名: 森亜るるか / version param: 33（33 Sparkle Shower）
- scratchpad/cap.mjs（グループ一括）, cap2.mjs（個別）, shot.mjs（単発）で撮影
- 画像アップロード: notion-create-file-upload → curl POST（token付き）→ file-upload://<id> を本文に埋め込み

## フェーズ

- [x] 参照元 Notion 3ページ + アプリ構造の調査
- [x] 執筆方針の確定（`manual-plan.md` / `page-plan.md`）
- [ ] スクリーンショットハーネス準備（**ユーザーの Chrome 終了待ち**）
- [ ] 各ページ執筆（下表）
- [ ] インデックス「🛖 BPIM2でできること」改訂
- [ ] 完成報告

## ハーネス状態

- puppeteer-core 23.11.1 : `scratchpad/node_modules/` にインストール済み
- `scratchpad/shots/` : 作成済み
- `scratchpad/shot.mjs` : スクショ取得スクリプト（`--blur`/`--click`/`--wait`/`--full` 対応）
- `scratchpad/launch-chrome.sh` : Chrome を :9222 付きで起動するスクリプト
- Chrome 再起動 : **未実行（ユーザーの Chrome 終了待ち）**

## ページ別ステータス

| # | ページ | Notion作成 | 画像添付 | Notion URL |
|---|---|---|---|---|
| A-1 | BPIとは? | done | (画像なし) | https://app.notion.com/p/3d19989ca87a81d9b0edc6b681133d16 |
| A-2 | アカウントを登録する | done | done | https://app.notion.com/p/3d19989ca87a81f1b41fcff5c8a2bdc1 |
| A-3 | データを登録する | done | done | https://app.notion.com/p/3d19989ca87a8159a628ee0368618ded |
| B-1 | スコア一覧（プレイ済み / 未プレイ） | done | done | https://app.notion.com/p/3d19989ca87a81888aa3e9ec6bef9bac |
| B-2 | スコアを更新する（更新の記録と管理） | done | done | https://app.notion.com/p/3d19989ca87a8199bc71c6256b9ebe03 |
| B-3 | ソーシャル（タイムライン・通知・フォロー管理） | done | done | https://app.notion.com/p/3d19989ca87a81b79584e53b8cc5a1a1 |
| B-4 | 比較（ライバル比較・対戦） | done | done | https://app.notion.com/p/3d19989ca87a81ab8908fa49fb713d4b |
| B-5 | 指標（AAA達成難易度表・アリーナランク平均） | done | done | https://app.notion.com/p/3d19989ca87a81b19969ffc879922967 |
| B-6 | 設定 | done | done | https://app.notion.com/p/3d19989ca87a811b9477f9a7d7368b6d |
| B-7 | ベータ版機能 | done | done | https://app.notion.com/p/3d19989ca87a819bacd4fb265efe0e00 |
| C | インデックス改訂（🛖 BPIM2でできること） | done | - | https://app.notion.com/p/32a9989ca87a80829561f4b9618f1d6f |

## 補足・注意

- **全10ページ作成 + インデックス改訂まで完了。**
- インデックス改訂時に `replace_content` の改行が正しく渡らず、一時的に子ページ12件（既存の📊ダッシュボード・👥フォロー含む）がゴミ箱に入る事故が発生 → `notion-move-pages` で全件復旧済み。現在は全ページ `deleted` 状態ではないことを確認済み。
- Notion `replace_content` は改行を 
 文字列ではなく実際の改行で渡すこと。子ページを含むページへの replace は、全子ページを `<page>` ブロックで含めないと消える。
- スクショ用に起動した Chrome は **コピーしたプロファイル**（scratchpad/chrome-profile）で動作中。ユーザーの実プロファイルとは別。作業後は終了してよい。実Chromeはユーザーが再度開く。
- ユーザーが並行して各ページを加筆修正中（A-1 の BPI 定義説明など）。

