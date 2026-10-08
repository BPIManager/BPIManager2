/** `users.iidxId`（ハイフン有無が混在しうる）を`topRankers.iidxId`の形式（ハイフン無し）にそろえる */
export function normalizeIidxId(iidxId: string | null | undefined): string | null {
  const normalized = (iidxId ?? "").replace(/-/g, "");
  return normalized === "" ? null : normalized;
}
