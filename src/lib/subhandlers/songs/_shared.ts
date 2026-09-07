import { latestVersion, IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import type { IIDXVersion } from "@/types/iidx/version";
import type { HandlerResult } from "@/types/api";

/**
 * songs 全般（`/songs/**`、ユーザースコープ外）の subhandler 共通型・ヘルパー。
 * 認証は `resolveOptionalUid`（任意）。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
  /** v1 の成功ステータス（201/204 等）を維持するため */
  successStatus?: number;
}

export function num(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}
export function resolveVersion(raw: unknown): string {
  const v = String(raw ?? "");
  return (IIDX_VERSIONS as readonly string[]).includes(v) ? v : latestVersion;
}

export type { IIDXVersion };
