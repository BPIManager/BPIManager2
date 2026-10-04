import { sql } from "kysely";

/** `statsPrivacy as sp` と `officialArenaStats as oas` をJOINしたクエリ用。非公開ユーザーのアリーナクラスをNULLにマスクする */
export const maskedArenaClass = sql<
  string | null
>`CASE WHEN COALESCE(sp.showArenaClass, 1) = 0 THEN NULL ELSE oas.arenaClass END`;

/** アリーナクラスでの絞り込みから非公開ユーザーを除外する条件 */
export const arenaClassIsPublic = sql<boolean>`COALESCE(sp.showArenaClass, 1) = 1`;
