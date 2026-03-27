/**
 * 配列に対してアイテムのトグル操作を行うユーティリティ。
 * 含まれていれば削除、含まれていなければ追加した新しい配列を返す。
 */
export function toggleArrayItem<T>(current: T[] | undefined, item: T): T[] {
  const list = current ?? [];
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}
