#!/usr/bin/env bash
#
# VPS 側で実行する。ship.sh が転送した releases/<SHA>/ を
# current に原子的に張り替え、pm2 で再起動してヘルスチェックする。
# 失敗したら直前のリリースへ自動で戻す。
#
# 使い方: deploy.sh <リリース名（=コミットSHA）>
#
# 前提（DEPLOY.md 参照）。<base> は既定で $HOME/bpim2、DEPLOY_ROOT で上書き可:
#   <base>/shared/.env                 本番環境変数（リリースの外に置く）
#   <base>/shared/ecosystem.config.js  pm2 設定（instances: 1）
#   <base>/shared/data/                実行時生成物の永続先（public/data の実体）
#   node / pnpm / pm2 が PATH にあること
#
# 実行ユーザーは問わない（このスクリプトを走らせるユーザーの権限で完結する）。
# DB マイグレーションはこのスクリプトでは行わない。スキーマ変更は
# デプロイ前に手動で当てる運用（DEPLOY.md「DB スキーマ変更」を参照）。
#
set -euo pipefail

REL="${1:?usage: deploy.sh <release-sha>}"
BASE="${DEPLOY_ROOT:-$HOME/bpim2}"
NEW="$BASE/releases/$REL"
SHARED="$BASE/shared"
HEALTH_URL="http://127.0.0.1:3005/api/health"

[ -d "$NEW" ] || { echo "release dir not found: $NEW" >&2; exit 1; }

PREV=""
if [ -L "$BASE/current" ]; then
  PREV="$(readlink -f "$BASE/current" || true)"
fi

switch_to() {
  # ln -sfn + mv -T で current を原子的に張り替える
  ln -sfn "$1" "$BASE/current.tmp"
  mv -Tf "$BASE/current.tmp" "$BASE/current"
}

restart_pm2() {
  if pm2 describe bpim2 >/dev/null 2>&1; then
    pm2 restart "$SHARED/ecosystem.config.js" --update-env
  else
    pm2 start "$SHARED/ecosystem.config.js" --update-env
  fi
}

# ── リリースの準備 ─────────────────────────────────────────
mkdir -p "$SHARED/data"
ln -sfn "$SHARED/.env" "$NEW/.env"
mkdir -p "$NEW/public"
ln -sfn "$SHARED/data" "$NEW/public/data"

# ネイティブ依存を実行環境で解決する。pnpm の store 経由でハードリンクされるため
# リリースごとに実行しても実コストは小さい。
( cd "$NEW" && pnpm install --frozen-lockfile --prefer-offline --prod=false )

# ── 切り替え & 再起動 ──────────────────────────────────────
switch_to "$NEW"
restart_pm2

# ── ヘルスチェック（最大 60 秒）────────────────────────────
healthy=0
for _ in $(seq 1 30); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then healthy=1; break; fi
  sleep 2
done

if [ "$healthy" != 1 ]; then
  echo "health check failed for $REL" >&2
  if [ -n "$PREV" ] && [ -d "$PREV" ] && [ "$PREV" != "$NEW" ]; then
    echo "rolling back to $(basename "$PREV")" >&2
    switch_to "$PREV"
    restart_pm2
  fi
  exit 1
fi

# ── 後片付け: 新しい方から 5 世代だけ残す ─────────────────
ls -1dt "$BASE"/releases/*/ 2>/dev/null | tail -n +6 | xargs -r rm -rf

echo "deployed $REL"
