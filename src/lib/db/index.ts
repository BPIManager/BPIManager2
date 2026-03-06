import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import "dotenv/config";
import { Database } from "@/types/sql";

const dialect = new MysqlDialect({
  pool: createPool({
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PW,
    connectionLimit: 10,
    port: 3306,
  }) as any,
});

export const db = new Kysely<Database>({
  dialect,
  log(event) {
    console.log(event);
    if (event.level === "query") {
      console.log(`[SQL] ${event.query.sql}`);
      console.log(`[Params] ${JSON.stringify(event.query.parameters)}`);
      console.log(`[Duration] ${event.queryDurationMillis}ms`);
    }
    if (event.level === "error") {
      console.error("[Kysely Error]", event.error);
    }
  },
});
