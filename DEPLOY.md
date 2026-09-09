# デプロイ手順（本番 VPS）

`master` への push で GitHub Actions が `verify`（tsc / lint / unit test / build）を
通した後、`deploy` ジョブが VPS へリリースを配って `pm2 restart` する。
DB マイグレーションは自動化しない（後述）。

- CI/CD 定義: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
- ランナー側スクリプト: [`deploy/ship.sh`](deploy/ship.sh)
- VPS 側スクリプト: [`deploy/deploy.sh`](deploy/deploy.sh)
- pm2 設定テンプレート: [`deploy/ecosystem.config.js`](deploy/ecosystem.config.js)

## 用語

- **deploy user** … GitHub Actions が SSH ログインする VPS 上のユーザー。専用の
  非特権ユーザーを推奨（`pm2 startup` の一度だけ sudo が要るが、それ以外は
  このユーザーの権限だけで完結する）。root でも動くが、常用は避けるのが無難。
- **`<base>`** … deploy user のホーム配下の作業ルート。既定 `~/bpim2`。
  変えたい場合は GitHub Variable `DEPLOY_PATH`（ホームからの相対パス）で上書きし、
  VPS 側では `DEPLOY_ROOT` 環境変数を `deploy.sh` / pm2 に渡す。

---

## デプロイモデル

- **単一プロセス**（pm2 `instances: 1` / fork）。cluster や複数プロセスにすると
  `src/instrumentation.ts` の cron が多重発火し、Discord bot が多重接続するため。
- デプロイは `pm2 restart`（`reload` ではない）。新旧プロセスが重ならないので
  cron の二重実行や bot の多重接続が起きない。代償として**切り替え時に数秒の断**。
- ディレクトリ構成:

  ```
  <base>/
  ├── releases/<commit-sha>/   … 各リリース（.next / node_modules / public など）
  ├── current -> releases/<sha> … 稼働中リリースへの symlink（原子的に張り替え）
  └── shared/
      ├── .env                  … 本番環境変数（リリースの外に置く）
      ├── ecosystem.config.js   … pm2 設定
      └── data/                 … 実行時生成物の永続先（各リリースの public/data の実体）
  ```

- `public/data/` を `shared/data/` の symlink にする理由: cron が sitemap / arena JSON /
  info JSON をここへ書く。リリースごとの実体だとデプロイのたびに消え、再生成まで
  該当ページが 404 になり、毎回 DB 再集計が走る。

---

## 初回セットアップ

### 1. GitHub 側

- **Secrets**（Settings → Secrets and variables → Actions → Secrets）
  - `DEPLOY_KEY` … デプロイ専用 SSH 秘密鍵（PEM 全文）
  - `VPS_HOST` … 接続先ホスト名 / IP
  - `VPS_USER` … deploy user 名
  - `VPS_PORT` … （任意）SSH ポート。標準（22）以外なら設定する
- **Variables**（同 → Variables）
  - `DEPLOY_ENABLED` = `true` … これが `true` になるまで `deploy` ジョブは skip される
    （`verify` は常に動く）
  - `DEPLOY_PATH` … （任意）`<base>` をホームからの相対パスで指定。未設定なら `bpim2`
- ブランチ保護（Settings → Rules）で `verify` を `master` の必須チェックにしておく。

### 2. deploy user と SSH 鍵

```bash
# VPS 側（root で一度だけ。専用ユーザーを作る場合）
useradd -m -s /bin/bash bpim               # 名前は任意。VPS_USER に合わせる
loginctl enable-linger bpim                # ログアウト・再起動をまたいで常駐させる

# 鍵を作る（VPS 上でも手元でもよい。ここでは deploy user 内で作る例）
sudo -u bpim ssh-keygen -t ed25519 -f /home/bpim/.ssh/github_actions_deploy -N "" \
  -C "github-actions-deploy"
#  *.pub → /home/bpim/.ssh/authorized_keys へ追記（chmod 700 .ssh / 600 authorized_keys）
#  秘密鍵 → GitHub Secret DEPLOY_KEY へ登録
#  SSH が標準ポート以外なら GitHub Secret VPS_PORT も設定する
```

### 3. VPS 側（deploy user で）

```bash
# ランタイム。nvm で Node を入れる（バージョンは本番稼働中のものに合わせる）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 22          # 本番で動いている系列に合わせる
corepack enable         # pnpm
npm i -g pm2

BASE=~/bpim2                       # DEPLOY_PATH を使うなら合わせる
mkdir -p "$BASE/releases" "$BASE/shared/data"

# 本番環境変数
$EDITOR "$BASE/shared/.env"        # DATABASE_URL, Firebase, Discord トークン等
#   ユーザー削除バックアップの保存先も shared 配下へ:
#   USER_DELETION_BACKUP_DIR=<base の絶対パス>/shared/backups

# pm2 設定（リポジトリのテンプレートをコピー）
cp <repo>/deploy/ecosystem.config.js "$BASE/shared/ecosystem.config.js"
#   <base> を変えている場合は pm2 起動時に DEPLOY_ROOT を渡す

# ネイティブ依存の build 許可は pnpm-workspace.yaml の allowBuilds で足りる
#   （初回 pnpm install で対話確認が出たら approve）

# 初回だけ手動でリリースを1つ作って pm2 起動 → 常駐化
#   （2回目以降は GitHub Actions が deploy.sh を叩く）
pm2 start "$BASE/shared/ecosystem.config.js"
pm2 save
```

#### ブート時自動起動（SELinux 環境では systemd **ユーザー**サービスにする）

`pm2 startup`（system サービス）は、SELinux Enforcing だと systemd(`init_t`) が
nvm 配下（`user_home_t`）の node/pm2 を exec できず `203/EXEC` で失敗する。
deploy user の systemd ユーザーサービス + linger で常駐させる:

```bash
# root で1度: ログアウト・再起動をまたいでユーザーマネージャを動かす
loginctl enable-linger <deploy-user>

# deploy user で: ~/.config/systemd/user/pm2-<user>.service を作成（Type=forking,
#   ExecStart=<nvm>/lib/node_modules/pm2/bin/pm2 resurrect, PM2_HOME=~/.pm2,
#   Environment=PATH=<nvm/bin>:/usr/bin:/bin, WantedBy=default.target）
systemctl --user daemon-reload
systemctl --user enable pm2-<user>
# 検証: pm2 kill してから
systemctl --user start pm2-<user>   # dump.pm2 から復帰することを確認
```

### 4. 有効化

`DEPLOY_ENABLED=true` にして `master` へ push（または既存コミットを空 push）すると
`deploy` ジョブが走る。

---

## 日常の流れ

1. PR を作る → `verify` 緑を確認 → `master` へマージ
2. `deploy` ジョブが自動で:
   - ランナーで `pnpm install` + `pnpm build`
   - `.next` / `public` / マニフェスト / `deploy/` を `<base>/releases/<sha>/` へ rsync
   - VPS で `deploy.sh <sha>`:
     `.env` と `public/data` を symlink → `pnpm install`（ネイティブ依存を実行環境で解決）
     → `current` を原子的に張り替え → `pm2 restart` → `/api/health` を最大 60 秒待つ
   - ヘルスチェック失敗時は直前リリースへ**自動ロールバック**して非ゼロ終了
   - 成功時に GitHub Release（`deploy-<日時>-<短SHA>`、ノートは自動生成）
3. リリースは新しい方から 5 世代保持。

### 手動ロールバック

```bash
ssh <VPS_USER>@<VPS_HOST>
bash ~/bpim2/releases/<戻したいSHA>/deploy/deploy.sh <戻したいSHA>
```

---

## DB スキーマ変更

**自動化しない。** `migrations/schema.sql` を単一ファイルで管理する現行方針
（[README](README.md) 参照）のまま、変更は手動で当てる。

事故防止のため、スキーマ差分を伴うデプロイは次の順で行う:

1. スキーマ差分（`ALTER TABLE` 等）を**先に本番 DB へ手動適用**する
   - 新カラム追加・インデックス追加など、旧コードでも壊れない後方互換な変更に限る
2. コード（`migrations/schema.sql` 更新込み）を `master` へマージ → 自動デプロイ
3. カラム削除・リネームなど後方非互換な変更は、コードから参照が消えたのを確認して
   から次のデプロイ以降で実施する

`deploy.sh` は DB に一切触れない。

---

## トラブルシュート

- **ヘルスチェックが通らずロールバックされる**: `pm2 logs bpim2` を確認。
  `shared/.env` の不足、`pnpm install` 失敗（`pnpm-workspace.yaml` の
  `allowBuilds` にネイティブ依存が入っているか）、ポート 3005 の競合を疑う。
- **cron が二重に動く / bot が多重接続**: `pm2 describe bpim2` で `instances` が 1 か、
  `ecosystem.config.js` が cluster になっていないか確認。
- **`public/data` の中身が空**: `<base>/shared/data` が存在し、`current/public/data`
  がそこへの symlink になっているか確認。初回は cron の起動時ジョブが埋めるまで待つ。
