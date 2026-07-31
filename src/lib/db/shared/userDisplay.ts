/**
 * ランキング・一覧系クエリで繰り返し使われる「表示用ユーザー情報」の
 * SELECTカラムリストを組み立てる。
 *
 * `userId`/`userName`/`profileImage`/`isPublic`の4列は、非公開ユーザーの
 * マスク処理（`shared/privacyMask.ts`の`maskPrivateIdentity`）に必要な
 * 最小セットのため、この4列を返す用途に限定している。ドメインごとに追加で必要な列
 * （`profileText`/`iidxId`等）は呼び出し側で個別に足す。
 *
 * @param alias - `users` テーブルのJOINエイリアス（例: `"u"`）
 */
export function userDisplayColumns<Alias extends string>(alias: Alias) {
  return [
    `${alias}.userId`,
    `${alias}.userName`,
    `${alias}.profileImage`,
    `${alias}.isPublic`,
  ] as const;
}
