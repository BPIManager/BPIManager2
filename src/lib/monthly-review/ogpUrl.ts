import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import type { OgpSectionKey } from "./ogpSections";

/**
 * monthly-reviewのOGP画像URL。ページの`<Meta ogImage>`とシェアパネルの
 * プレビュー表示の両方から使うため、組み立てロジックを1箇所にまとめる。
 *
 * `origin`省略時は本番ドメイン固定（`<meta og:image>`はクローラーが直接叩く
 * 絶対URLである必要があるため）。シェアパネルのプレビューは今表示している
 * オリジン（`window.location.origin`）を渡すことで、開発環境でもそのサーバーの
 * 実装がそのまま反映される（本番ドメイン固定だと、まだデプロイされていない
 * 変更がプレビューに反映されない）
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
  const compareParam = compareVersion ? `&compareVersion=${compareVersion}` : "";
  return `${origin}${API_V2_PREFIX}/users/${userId}/stats/monthly-review/ogp?version=${version}&month=${month}&ogp=${sections.join(",")}${compareParam}`;
}
