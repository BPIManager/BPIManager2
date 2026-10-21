import { AnalyticsTargetKind, AnalyticsTarget } from "@/types/analytics";

/**
 * {@link AnalyticsTarget} を URL クエリに埋め込める文字列にエンコードする。
 *
 * @param t - エンコード対象のターゲット
 * @returns `encodeURIComponent` 済みの文字列
 */
export function encodeTarget(t: AnalyticsTarget): string {
  const kind = t.version ? `${t.kind}@${t.version}` : t.kind;
  return encodeURIComponent(`${kind}:${t.param ?? ""}:${t.label}`);
}

/**
 * {@link encodeTarget} でエンコードされた文字列を {@link AnalyticsTarget} にデコードする。
 *
 * @param raw - エンコード済み文字列
 * @returns デコード結果。パースに失敗した場合は `null`
 */
export function decodeTarget(raw: string): AnalyticsTarget | null {
  try {
    const decoded = decodeURIComponent(raw);
    const [kindPart, param, ...labelParts] = decoded.split(":");
    const label = labelParts.join(":");
    if (!kindPart) return null;
    const [kind, version] = kindPart.split("@");
    return {
      kind: kind as AnalyticsTargetKind,
      param: param || undefined,
      version: version || undefined,
      label,
    };
  } catch {
    return null;
  }
}
