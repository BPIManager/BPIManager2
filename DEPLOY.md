# デプロイ手順（本番 VPS）

`master` への push で GitHub Actions が `verify`（tsc / lint / unit test / build）を
通した後、`deploy` ジョブが VPS へリリースを配って `pm2 restart` する。
DB マイグレーションは自動化しない（後述）。

- CI/CD 定義: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
- ランナー側スクリプト: [`deploy/ship.sh`](deploy/ship.sh)
- VPS 側スクリプト: [`deploy/deploy.sh`](deploy/deploy.sh)
- pm2 設定テンプレート: [`deploy/ecosystem.config.js`](deploy/ecosystem.config.js)

---

## デプロイモデル

- **単一プロセス**（pm2 `instances: 1` / fork）。cluster や複数プロセスにすると
  `src/instrumentation.ts` の cron が多重発火し、Discord bot が多重接続するため。
- デプロイは `pm2 restart`（`reload` ではない）。新旧プロセスが重ならないので
  cron の二重実行や bot の多重接続が起きない。代償として**切り替え時に数秒の断**。
- ディレクトリ構成（VPS、`~` は SSH ユーザーのホーム）:

  ```
  ~/bpim2/
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
  - `VPS_USER` … 接続ユーザー（`root` 運用なら `root`）
- **Variables**（同 → Variables）
  - `DEPLOY_ENABLED` = `true` … これが `true` になるまで `deploy` ジョブは skip される
    （`verify` は常に動く）
- ブランチ保護（Settings → Branches → `master`）で `verify` を必須チェックにしておく。

### 2. デプロイ用 SSH 鍵

```bash
ssh-keygen -t ed25519 -f deploy_key -N "" -C "github-actions-deploy"
# deploy_key.pub の中身を VPS の ~/.ssh/authorized_keys へ追記
# deploy_key（秘密鍵）の中身を GitHub Secret DEPLOY_KEY へ登録
```

### 3. VPS 側

```bash
# ランタイム（バージョンは .nvmrc / package.json に合わせる）
#   Node 26 系, corepack 経由で pnpm 11 系, pm2
corepack enable
npm i -g pm2

mkdir -p ~/bpim2/releases ~/bpim2/shared/data

# 本番環境変数
vim ~/bpim2/shared/.env          # DATABASE_URL, Firebase, Discord トークン等
#   ユーザー削除バックアップの保存先も shared 配下に:
#   USER_DELETION_BACKUP_DIR=/root/bpim2/shared/backups

# pm2 設定（リポジトリのテンプレートをコピー）
cp <repo>/deploy/ecosystem.config.js ~/bpim2/shared/ecosystem.config.js

# ネイティブ依存の build 許可（pnpm-workspace.yaml の一覧と一致させる）
#   初回 pnpm install 時に対話で聞かれたら approve、または:
pnpm config set --location project ...   # 不要。pnpm-workspace.yaml の allowBuilds で足りる

# 初回だけ手動でリリースを作って pm2 起動 → 常駐化
#   （2回目以降は GitHub Actions が deploy.sh を叩く）
pm2 start ~/bpim2/shared/ecosystem.config.js
pm2 save
pm2 startup     # 表示されたコマンドを実行してブート時自動起動を有効化
```

### 4. 有効化

`DEPLOY_ENABLED=true` にして `master` へ push（または既存コミットを空 push）すると
`deploy` ジョブが走る。

---

## 日常の流れ

1. PR を作る → `verify` 緑を確認 → `master` へマージ
2. `deploy` ジョブが自動で:
   - ランナーで `pnpm install` + `pnpm build`
   - `.next` / `public` / マニフェスト / `deploy/` を `~/bpim2/releases/<sha>/` へ rsync
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
  `~/bpim2/shared/.env` の不足、`pnpm install` 失敗（`pnpm-workspace.yaml` の
  `allowBuilds` にネイティブ依存が入っているか）、ポート 3000 の競合を疑う。
- **cron が二重に動く / bot が多重接続**: `pm2 describe bpim2` で `instances` が 1 か、
  `ecosystem.config.js` が cluster になっていないか確認。
- **`public/data` の中身が空**: `~/bpim2/shared/data` が存在し、`current/public/data`
  がそこへの symlink になっているか確認。初回は cron の起動時ジョブが埋めるまで待つ。
