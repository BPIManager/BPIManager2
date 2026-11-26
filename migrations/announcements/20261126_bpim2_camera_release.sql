-- BPIM2 Camera リリースのお知らせ。
-- 本番DBで実行すると、publishedAt を過ぎた時点から、全ユーザーのお知らせ（ベルのアイコン）に表示される。
-- 同じお知らせを二重に登録しないよう、同一タイトルが無いときだけ追加する。
-- 本文は表示のとき改行がそのまま使われる（whitespace-pre-line）。
-- 公開を止めるときは、isPublished を 0 にする:
--   UPDATE `announcements` SET `isPublished` = 0 WHERE `title` = 'BPIM2 Cameraをリリースしました';

INSERT INTO `announcements` (`title`, `body`, `linkUrl`, `publishedAt`, `isPublished`)
SELECT
  'BPIM2 Cameraをリリースしました',
  'スマホのカメラでリザルト画面を撮影するだけで、自動でスコアを読み取り、BPIM2に登録できます。
BPIや推定順位などの情報を添えてリザルト画像をXにシェアすることもできます。',
  'https://bpi-cam.poyashi.me',
  NOW(),
  1
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `announcements` WHERE `title` = 'BPIM2 Cameraをリリースしました'
);
