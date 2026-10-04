import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import type { OgpSectionKey } from "./ogpSections";

/**
 * monthly-review のOGP画像URLを組み立てる。ページの ogImage とシェアパネルのプレビューで共用する。
 * origin 省略時は本番固定（クローラーは絶対URLが必要）。プレビューは window.location.origin を渡し、開発環境の変更を反映する。
 */
export function buildOgpImageUrl(params: {
  userId: string;
  version: string;
  month: string;
  sections: [OgpSectionKey, OgpSectionKey];
  origin?: string;
  /** 全期間(version)モードでユーザーが選択中の比較先バージョン（前作比バッジ用） */
  compareVersion?: string;
}): string {
  const {
    userId,
    version,
    month,
    sections,
    origin = "https://bpi2.poyashi.me",
    compareVersion,
  } = params;
  const compareParam = compareVersion
    ? `&compareVersion=${encodeURIComponent(compareVersion)}`
    : "";
  return `${origin}${API_V2_PREFIX}/users/${encodeURIComponent(userId)}/stats/monthly-review/ogp?version=${encodeURIComponent(version)}&month=${encodeURIComponent(month)}&ogp=${sections.join(",")}${compareParam}`;
}
