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

/**
 * 複数の{@link AnalyticsTarget}をURLクエリに埋め込める1つの文字列に
 * エンコードする（#287、複数ターゲット比較用）。
 *
 * 各ターゲットは{@link encodeTarget}で個別にエンコード済み（コロン・カンマ
 * を含め`encodeURIComponent`で escape 済み）なので、`,`で単純に連結して
 * 区切って問題ない。
 *
 * @param targets - エンコード対象のターゲット配列
 */
export function encodeTargets(targets: AnalyticsTarget[]): string {
  return targets.map(encodeTarget).join(",");
}

/**
 * {@link encodeTargets} でエンコードされた文字列を{@link AnalyticsTarget}の
 * 配列にデコードする。個別のデコードに失敗した要素は読み飛ばす。
 *
 * @param raw - エンコード済み文字列
 */
export function decodeTargets(raw: string | undefined): AnalyticsTarget[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map(decodeTarget)
    .filter((t): t is AnalyticsTarget => t !== null);
}
