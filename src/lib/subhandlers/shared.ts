import { IIDX_VERSIONS, latestVersion } from "@/constants/iidx/iidxVersions";

/**
 * subhandler 層で共有する小さなヘルパ群。
 */

/** クエリの version 値を検証し、未知の値なら最新バージョンへフォールバックする */
export function resolveVersion(raw: unknown): string {
  const v = String(raw ?? "");
  return (IIDX_VERSIONS as readonly string[]).includes(v) ? v : latestVersion;
}

/**
 * 500 応答に載せる汎用メッセージを返す。例外の詳細（DBエラーの断片・接続先など）は
 * クライアントに返さず、サーバーログにのみ出す。
 */
export function toErrorMessage(error: unknown): string {
  console.error(error);
  return "Internal Server Error";
}
