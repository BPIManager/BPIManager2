import fs from "fs/promises";
import path from "path";

/**
 * site 系（`/api/*` 直下の非ユーザースコープ・公開エンドポイント）の subhandler 共通ヘルパー。
 * ユーザーコンテキストを持たないため各ハンドラーは `HandlerResult` をそのまま返し、meta は付けない。
 */
export async function readJsonFile(relPath: string): Promise<unknown> {
  const raw = await fs.readFile(path.join(process.cwd(), relPath), "utf-8");
  return JSON.parse(raw);
}
