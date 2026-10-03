/**
 * Kysely による MySQL 接続のシングルトン。開発時の HMR による多重生成はグローバル変数で防ぐ。
 * @module
 */
import { Kysely, MysqlDialect, MysqlPool } from "kysely";
import { createPool } from "mysql2";
import "dotenv/config";
import { Database } from "@/types/db";
const globalForDb = global as unknown as { db: Kysely<Database> };
const dialect = new MysqlDialect({
  pool: createPool({
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PW,
    connectionLimit: 50,
    port: Number(process.env.DB_PORT ?? 3306),
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
