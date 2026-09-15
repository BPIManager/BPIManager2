#!/usr/bin/env bash
#
# GitHub Actions ランナー側で実行する。ビルド済みの成果物を VPS の
# <base>/releases/<SHA>/ へ転送し、リモートの deploy.sh を叩いて切り替えさせる。
#
# 必要な環境変数（ci.yml の deploy ジョブが Secret / Variable から渡す）:
#   DEPLOY_SSH_KEY  デプロイ用 SSH 秘密鍵（PEM 全文）
#   VPS_HOST        接続先ホスト
#   VPS_USER        接続ユーザー
#   VPS_PORT        （任意）SSH ポート。既定 22
#   DEPLOY_PATH     （任意）接続ユーザーのホームからの相対パス。既定 "bpim2"
#
set -euo pipefail

: "${DEPLOY_SSH_KEY:?}" "${VPS_HOST:?}" "${VPS_USER:?}"

REL="${GITHUB_SHA:?}"
REMOTE_BASE="${DEPLOY_PATH:-bpim2}" # 接続ユーザーのホーム配下
VPS_PORT="${VPS_PORT:-22}"
DEST="${VPS_USER}@${VPS_HOST}:~/${REMOTE_BASE}/releases/${REL}/"

KEY_FILE="$(mktemp)"
trap 'rm -f "$KEY_FILE"' EXIT
printf '%s\n' "$DEPLOY_SSH_KEY" > "$KEY_FILE"
chmod 600 "$KEY_FILE"

# -p は ssh でも rsync の -e "ssh ..." 文字列でもそのまま効く
SSH_OPTS=(-i "$KEY_FILE" -p "$VPS_PORT" -o StrictHostKeyChecking=accept-new -o BatchMode=yes)

ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" "mkdir -p ~/${REMOTE_BASE}/releases/${REL}"

# next start に必要な最小構成だけ送る。node_modules は VPS 側で pnpm install する
# （ネイティブ依存を実行環境で解決するため）。public/data は shared/ を symlink する
# ので送らない（deploy.sh が張り替える）。
# -R (--relative) が無いと src/assets/fonts のような多階層パスは basename
# （fonts/）だけが転送先直下に置かれ、process.cwd() 起点で読むコードと
# パスがずれて ENOENT になる。
#
# VPS 側のネットワーク状態次第で数分〜十数分かかることがあり、無出力が続くと
# ハングと区別が付かない。rsync --info=progress2 は \r で同一行を上書きする形式で
# CIログ越しだと1行に潰れて読みにくいため、バックグラウンド実行にして
# 一定間隔でこちらから改行付きの経過ログを出す。
RSYNC_LOG="$(mktemp)"
rsync -az --delete -R \
  --info=progress2 --outbuf=L \
  -e "ssh ${SSH_OPTS[*]}" \
  --exclude 'public/data' \
  .next \
  src/assets/fonts \
  public \
  package.json \
  pnpm-lock.yaml \
  pnpm-workspace.yaml \
  next.config.ts \
  deploy \
  "$DEST" >"$RSYNC_LOG" 2>&1 &
RSYNC_PID=$!

SECONDS=0
while kill -0 "$RSYNC_PID" 2>/dev/null; do
  sleep 20
  LAST_LINE="$(tr '\r' '\n' <"$RSYNC_LOG" | grep -v '^$' | tail -n1)"
  echo "[ship.sh] rsync転送中... ${SECONDS}s経過 - ${LAST_LINE:-転送準備中}"
done

RSYNC_EXIT=0
wait "$RSYNC_PID" || RSYNC_EXIT=$?
tr '\r' '\n' <"$RSYNC_LOG" | grep -v '^$' | tail -n5
rm -f "$RSYNC_LOG"
if [ "$RSYNC_EXIT" -ne 0 ]; then
  echo "[ship.sh] rsync failed (exit ${RSYNC_EXIT})" >&2
  exit "$RSYNC_EXIT"
fi

ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" \
  "GIT_COMMIT=${REL} bash ~/${REMOTE_BASE}/releases/${REL}/deploy/deploy.sh ${REL}"
