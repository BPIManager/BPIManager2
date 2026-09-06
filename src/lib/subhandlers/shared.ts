import { IIDX_VERSIONS, latestVersion } from "@/constants/iidx/iidxVersions";

/**
 * subhandler 層で共有する小さなヘルパ群。
 */

/** クエリの version 値を検証し、未知の値なら最新バージョンへフォールバックする */
export function resolveVersion(raw: unknown): string {
  const v = String(raw ?? "");
  return (IIDX_VERSIONS as readonly string[]).includes(v) ? v : latestVersion;
}

/** unknown な例外から 500 レスポンス用のメッセージを取り出す */
export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Internal Server Error";
}
