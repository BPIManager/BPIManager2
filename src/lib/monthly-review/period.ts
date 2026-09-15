import dayjs from "@/lib/dayjs";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";

type Granularity = "month" | "year" | "version";

/**
 * 期間ラベル（末尾修飾なしの生の値）。例: "2026年8月" / "2026年" / "IIDX 33 Sparkle Shower"。
 * サーバー（OGP画像生成）・クライアント（ページタイトル・TitleSection）の両方から使う。
 */
export function periodLabelOf(
  month: string,
  version: string,
  granularity: Granularity,
): string {
  if (granularity === "version") {
    return version === "INF"
      ? "INFINITAS"
      : `IIDX ${getVersionNameFromNumber(version)}`;
  }
  if (granularity === "year") return dayjs.tz(`${month}-01-01`).format("YYYY年");
  return dayjs.tz(`${month}-01`).format("YYYY年M月");
}

/** ページタイトル・OGP見出し用の「〜の振り返り」形式。 */
export function periodHeadingOf(
  month: string,
  version: string,
  granularity: Granularity,
): string {
  return `${periodLabelOf(month, version, granularity)}の振り返り`;
}
