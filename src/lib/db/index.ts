/**
 * Kysely を使用した MySQL データベース接続のシングルトンインスタンスを提供するモジュール。
 *
 * 開発環境では HMR による接続の多重生成を防ぐため、グローバル変数を介してインスタンスを共有する。
 * 接続設定は環境変数（`DB_HOST`, `DB_USER`, `DB_PW`, `DB_DATABASE`）から読み込む。
 *
 * @module
 */
import { Kysely, MysqlDialect, MysqlPool } from "kysely";
import { createPool } from "mysql2";
import "dotenv/config";
import { Database } from "@/types/sql";
const globalForDb = global as unknown as { db: Kysely<Database> };
const dialect = new MysqlDialect({
  pool: createPool({
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PW,
    connectionLimit: 50,
    port: 3306,
    waitForConnections: true,
    maxIdle: 10,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: "Z",
  }) as unknown as MysqlPool,
});

/**
 * アプリ全体で共有される Kysely データベースインスタンス。
 * 開発時は `global` を利用してシングルトンを維持する。
 */
export const db =
  globalForDb.db ||
  new Kysely<Database>({
    dialect,
    log(event) {
      if (event.level === "error") {
        console.error("[Kysely Error]", event.error);
      }
    },
  });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
