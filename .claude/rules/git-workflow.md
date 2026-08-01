# Git運用

- GitHub issueに紐づく作業をコミットするときは、1 issue = 1 commit を徹底する。複数issueにまたがる変更を1つのcommitにまとめない
- コミットメッセージ本文に `Refs #<issue番号>`（作業中）または `Closes #<issue番号>`（そのcommitで完了する場合）を含め、GitHub上でissueとcommitが自動的に紐づくようにする
- `git add` で意図しないファイルまで巻き込まないよう、対象issueに関係するファイルだけを明示的に指定してstageする（`git add -A`/`git add .` は使わない）
- issueをcloseするのは、対応するcommitが作成され、GitHub上でissueとの関連付け(コミットメッセージ内の `#<issue番号>` 参照)が確認できてから
