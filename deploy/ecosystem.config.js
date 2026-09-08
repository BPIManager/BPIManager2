// pm2 設定。VPS の <base>/shared/ecosystem.config.js としてこのファイルを配置する
// （DEPLOY.md の初回セットアップ手順を参照）。<base> は既定で $HOME/bpim2、
// deploy.sh と揃える形で DEPLOY_ROOT 環境変数でも上書きできる。
//
// instances: 1 / fork モードで固定する。cluster や複数プロセスにすると
// src/instrumentation.ts の cron が多重発火し、Discord bot が同一トークンで
// 多重接続するため。ゼロダウンタイムより単一プロセスの安全を優先する
// （デプロイ時は pm2 restart による数秒の断を許容する）。
const BASE = process.env.DEPLOY_ROOT || `${process.env.HOME}/bpim2`;

module.exports = {
  apps: [
    {
      name: "bpim2",
      cwd: `${BASE}/current`,
      script: "./node_modules/.bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      // cron の後始末と Discord gateway の切断に猶予を与える
      kill_timeout: 10000,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
