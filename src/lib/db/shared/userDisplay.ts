/**
 * ランキング・一覧系で使う表示用ユーザー情報の SELECT カラムを組み立てる。
 * userId/userName/profileImage/isPublic は非公開マスク（maskPrivateIdentity）に必要な最小セット。追加列は呼び出し側で足す。
 *
 * @param alias - users テーブルの JOIN エイリアス（例: u）
 */
export function userDisplayColumns<Alias extends string>(alias: Alias) {
  return [
    `${alias}.userId`,
    `${alias}.userName`,
    `${alias}.profileImage`,
    `${alias}.isPublic`,
  ] as const;
}
