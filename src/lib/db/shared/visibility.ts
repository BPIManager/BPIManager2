import { sql, type SelectQueryBuilder } from "kysely";

/**
 * 本人・公開ユーザー・有効な follows 関係のいずれかであれば閲覧可能としてtrueを返す。
 * follows は承認制フォローの結果としてのみ作られるため、存在自体が閲覧許可を意味する。DB参照は呼び出し元が hasFollowAccess として渡す。
 *
 * @param params.viewerId - 閲覧者のユーザーID（省略時は自分自身判定を行わない）
 * @param params.targetUserId - 対象ユーザーのID
 * @param params.isPublic - 対象ユーザーの公開設定
 * @param params.hasFollowAccess - 閲覧者から対象への有効な follows 関係の有無（省略可）
 */
export function canViewUserData(params: {
  viewerId?: string;
  targetUserId: string;
  isPublic: number | boolean;
  hasFollowAccess?: boolean;
}): boolean {
  const { viewerId, targetUserId, isPublic, hasFollowAccess } = params;
  return (
    (viewerId !== undefined && viewerId === targetUserId) ||
    !!isPublic ||
    !!hasFollowAccess
  );
}

/**
 * 一覧・タイムライン系クエリを公開ユーザーのみに絞り込む WHERE 条件を追加する。isPublic の直接参照を1箇所に集約し、閲覧許可バイパス追加時の変更点を限定する。
 *
 * @param qb - クエリビルダー
 * @param column - users の isPublic 列への参照（例: u.isPublic）
 */
export function wherePublicOnly<DB, TB extends keyof DB, O>(
  qb: SelectQueryBuilder<DB, TB, O>,
  column: string,
): SelectQueryBuilder<DB, TB, O> {
  return qb.where(sql.ref(column), "=", 1);
}
