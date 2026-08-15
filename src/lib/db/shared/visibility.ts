import { sql, type SelectQueryBuilder } from "kysely";

/**
 * 自分自身のデータ、または相手が公開設定(isPublic)の場合にtrueを返す。
 *
 * プロフィールアクセス制御・一覧のマスク要否判定で共通して使う。`viewerId`を
 * 省略した場合は自分自身判定を行わず、isPublicのみで判定する（匿名ランキング等、
 * 閲覧者が誰であっても結果が変わらない文脈で使う）。
 *
 * @param params.viewerId - 閲覧者のユーザーID（省略可）
 * @param params.targetUserId - 対象ユーザーのID
 * @param params.isPublic - 対象ユーザーの公開設定
 */
export function canViewUserData(params: {
  viewerId?: string;
  targetUserId: string;
  isPublic: number | boolean;
}): boolean {
  const { viewerId, targetUserId, isPublic } = params;
  return (viewerId !== undefined && viewerId === targetUserId) || !!isPublic;
}

/**
 * 一覧・タイムライン系クエリを公開ユーザーのみに絞り込むWHERE条件を追加する。
 *
 * `users`テーブルの`isPublic`列を直接条件に使っている箇所を集約する（将来の
 * 閲覧許可バイパス条件追加時に変更箇所を一箇所に留めるため）。
 *
 * @param qb - クエリビルダー
 * @param column - `users`テーブルの`isPublic`列への参照（例: `"u.isPublic"`）
 */
export function wherePublicOnly<DB, TB extends keyof DB, O>(
  qb: SelectQueryBuilder<DB, TB, O>,
  column: string,
): SelectQueryBuilder<DB, TB, O> {
  return qb.where(sql.ref(column), "=", 1);
}
