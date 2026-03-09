import { Kysely, MysqlDialect } from "kysely";
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
    connectionLimit: 1000,
    port: 3306,
    waitForConnections: true,
    maxIdle: 10,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: "Z",
  }) as any,
});

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
