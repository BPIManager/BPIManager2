import { z } from "zod";

// 2026-02-31 のような存在しない日付は、Date が繰り上げて別の日にするため往復で一致を確認する
const isRealDate = (v: string) => {
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

/** `latest`、または実在する日付の`YYYY-MM-DD`。不正な文字列は Invalid Date になるため入力時点で弾く */
export const asOfSchema = z
  .string()
  .refine(
    (v) =>
      v === "latest" ||
      (/^\d{4}-\d{2}-\d{2}$/.test(v) && isRealDate(v)),
    "asOf must be 'latest' or a valid YYYY-MM-DD date",
  );
