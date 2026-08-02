import { AnalyticsTargetKind, AnalyticsTarget } from "@/types/analytics";

/**
 * {@link AnalyticsTarget} を URL クエリに埋め込める文字列にエンコードする。
 *
 * @param t - エンコード対象のターゲット
 * @returns `encodeURIComponent` 済みの文字列
 */
export function encodeTarget(t: AnalyticsTarget): string {
  return encodeURIComponent(`${t.kind}:${t.param ?? ""}:${t.label}`);
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
    const [kind, param, ...labelParts] = decoded.split(":");
    const label = labelParts.join(":");
    if (!kind) return null;
    return {
      kind: kind as AnalyticsTargetKind,
      param: param || undefined,
      label,
    };
  } catch {
    return null;
  }
}
