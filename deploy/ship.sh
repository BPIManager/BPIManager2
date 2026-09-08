#!/usr/bin/env bash
#
# GitHub Actions ランナー側で実行する。ビルド済みの成果物を VPS の
# <base>/releases/<SHA>/ へ転送し、リモートの deploy.sh を叩いて切り替えさせる。
#
# 必要な環境変数（ci.yml の deploy ジョブが Secret / Variable から渡す）:
#   DEPLOY_SSH_KEY  デプロイ用 SSH 秘密鍵（PEM 全文）
#   VPS_HOST        接続先ホスト
#   VPS_USER        接続ユーザー
#   DEPLOY_PATH     （任意）接続ユーザーのホームからの相対パス。既定 "bpim2"
#
set -euo pipefail

: "${DEPLOY_SSH_KEY:?}" "${VPS_HOST:?}" "${VPS_USER:?}"

REL="${GITHUB_SHA:?}"
REMOTE_BASE="${DEPLOY_PATH:-bpim2}" # 接続ユーザーのホーム配下
DEST="${VPS_USER}@${VPS_HOST}:~/${REMOTE_BASE}/releases/${REL}/"

KEY_FILE="$(mktemp)"
trap 'rm -f "$KEY_FILE"' EXIT
printf '%s\n' "$DEPLOY_SSH_KEY" > "$KEY_FILE"
chmod 600 "$KEY_FILE"

SSH_OPTS=(-i "$KEY_FILE" -o StrictHostKeyChecking=accept-new -o BatchMode=yes)

ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" "mkdir -p ~/${REMOTE_BASE}/releases/${REL}"

# next start に必要な最小構成だけ送る。node_modules は VPS 側で pnpm install する
# （ネイティブ依存を実行環境で解決するため）。public/data は shared/ を symlink する
# ので送らない（deploy.sh が張り替える）。
rsync -az --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  --exclude 'public/data' \
  .next \
  public \
  package.json \
  pnpm-lock.yaml \
  pnpm-workspace.yaml \
  next.config.ts \
  deploy \
  "$DEST"

ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" \
  "GIT_COMMIT=${REL} bash ~/${REMOTE_BASE}/releases/${REL}/deploy/deploy.sh ${REL}"
