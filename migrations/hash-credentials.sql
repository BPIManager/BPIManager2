-- APIキーとOAuthクライアントシークレットを平文からSHA-256ハッシュへ移行する。
-- 1回だけ実行すること（2回目以降は secretLast4 / keyLast4 が埋まっている行を
-- 対象外にしているが、ALTER TABLE は再実行でエラーになる）。
-- マスク表示用に末尾4文字を先に別列へ退避してから、本体列をハッシュに置き換える。

ALTER TABLE `apiKeys` ADD COLUMN `keyLast4` varchar(4) DEFAULT NULL AFTER `key`;
UPDATE `apiKeys`
  SET `keyLast4` = RIGHT(`key`, 4), `key` = SHA2(`key`, 256)
  WHERE `keyLast4` IS NULL;

ALTER TABLE `oauthClients` ADD COLUMN `secretLast4` varchar(4) DEFAULT NULL AFTER `clientSecret`;
UPDATE `oauthClients`
  SET `secretLast4` = RIGHT(`clientSecret`, 4), `clientSecret` = SHA2(`clientSecret`, 256)
  WHERE `clientSecret` IS NOT NULL AND `secretLast4` IS NULL;
