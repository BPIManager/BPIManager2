---
name: remywiki-lookup
description: >
  RemyWiki から beatmania IIDX の曲情報（BPM・難易度別ノーツ数・レベル）を引いて、
  楽曲マスタ(allSongs)に足りない譜面のデータを補うスキル。Textage に譜面ページが無い譜面
  （INFINITAS限定曲・アーケード新曲・BEGINNER/NORMAL 等）の補完に使う。
  「RemyWikiで調べて」「ノーツ数を補って」「新曲のマスタを作って」と言うか、
  /remywiki-lookup で起動。
---

楽曲マスタに載せる譜面のうち、**Textage から取れないもの**を RemyWiki で補う。
一次情報は Textage（譜面ページのノーツ数・BPM）で、RemyWiki は**二次参照**。

## いつ使うか

- INFINITAS CSV の取り込みで `allSongs` に無い譜面（`scripts/buildInfinitasMasterTsv.ts` の missing 出力）
- アーケード公式CSVにあるが `allSongs` に無い新曲・新譜面（`scripts/buildArcadeNewSongsTsv.ts` の missing 出力）
- Textage の一覧にレベルだけ載っていて譜面ページ（ノーツ数）が無い譜面

## 手順

1. **ページ名を引く**: 検索APIは認証なしで使える。曲名が日本語でもローマ字ページが返る。
   `https://remywiki.com/api.php?action=query&list=search&format=json&srlimit=5&srprop=&srsearch=<曲名>`
   - ヘッダに `User-Agent` を付ける。リクエスト間は 0.5 秒以上空ける。
   - 候補が複数あるとき（Remix・別バージョン・同名別曲）は、曲名の括弧書きとアーティストで見分ける。
2. **ページを読む**: `WebFetch` で `https://remywiki.com/<ページ名>`（スペースは `_`）を開き、プロンプトで
   「beatmania IIDX only / BPM / SP の notecount 行 / 対象バージョンの level 行を原文のまま」と指定する。
   `?` や `-` は未知・譜面なしの意味。**推測で埋めない**。
3. **対象行を選ぶ**: 難易度表はバージョンごとに行が分かれる。
   - INFINITAS 譜面 → `beatmania IIDX INFINITAS (2020)` 行のレベルと、対応する notecounts
   - アーケード新曲 → `beatmania IIDX <最新版> →Present` 行
   - 「Old charts / New charts」に分かれる曲は、**どちらの譜面が INFINITAS／最新版か**をレベル行の対応で判断する。迷ったら採用せず確認に回す。
4. **検証**: 取った値は次で突き合わせる。合わなければ採用しない。
   - Textage / アーケードCSV に載っているレベルとの一致
   - INFINITAS CSV のスコアが「ノーツ数×2」以下か（`scripts/buildInfinitasMasterTsv.ts` 後の確認で行う）
5. **固定データ化**: 確認済みの値は `scripts/data/*-remywiki-supplement.json` に、出典と一緒に記録する。
   - INFINITAS 向け: `scripts/data/infinitas-remywiki-supplement.json`（`--supplement` でビルダーに渡す）
   - アーケード新曲向け: `scripts/data/zinrai-remywiki-supplement.json`（版ごとにファイルを分ける）

## 守ること

- **Cloudflare のチャレンジは回避しない。** `action=parse` 等のページ本文APIはチャレンジで止まる。
  本文は `WebFetch` で 1 曲ずつ読み、大量の機械取得はしない（対象は Textage で埋まらなかった少数に限る）。
- `WebFetch` は要約を経由するため、**数値の取り違え**があり得る（実際に、RemyWiki の表記と Textage の値が食い違った例あり）。
  Textage に値があればそちらを優先し、RemyWiki は Textage に無い譜面だけに使う。
- 曲名は **allSongs のタイトル（アーケード公式CSVの表記）** に合わせる。RemyWiki のタイトルは非ラテン文字を
  そのまま持つので、アーケードCSVが記号や文字を落とした表記の場合は CSV 側に合わせる（`scripts/generateInfinitasTitleCorrections.ts` の `MANUAL` も参照）。
- 同名の別曲（大文字小文字違い・Remix・旧版／新版）を取り違えない。
- DB への書き込み・本番SQLの実行は、ユーザーの確認を取ってから行う。

## 出力

補助データ JSON を作ったら、ビルダーに渡して TSV を再生成する。

```
npx tsx scripts/buildInfinitasMasterTsv.ts <infinitas.csv> <arcade.csv> <list.json> <textage_meta...> \
  --detail <detail.json> --supplement scripts/data/infinitas-remywiki-supplement.json --out <dir>
npx tsx scripts/buildArcadeNewSongsTsv.ts <arcade.csv> <list.json> <textage_meta...> \
  --detail <detail.json> --supplement scripts/data/zinrai-remywiki-supplement.json --out <dir>
npx tsx scripts/importInfinitasOnlySongs.ts <master.tsv> --dry-run            # 件数確認
npx tsx scripts/importInfinitasOnlySongs.ts <master.tsv> --sql <out.sql>      # 本番へ流すSQL
```

Textage 側の一覧・詳細の取得は、計算リポジトリ（`BPIM2-AutomatedDefinitionCalculator`）の
`b05-textage-infinitas.ts`（`list` / `detail`）で行う。
