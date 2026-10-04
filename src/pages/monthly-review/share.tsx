import { Meta } from "@/components/partials/common/PageChrome/Head";
import DashboardLayout from "@/components/partials/shell/DashboardLayout";
import MonthlyReviewShare from "@/components/partials/features/MonthlyReviewShare";
import { useTranslation } from "@/hooks/common/useTranslation";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { SITE_URL } from "@/constants/site/url";

/**
 * 告知用の userId を含まない共有URL。アクセスしたユーザー自身の先月のまとめへリダイレクトする。
 * userId 未確定のため og:image は実データを使えず、サンプルOGP（/api/v2/site/ogp-sample）を使う。
 */
export default function MonthlyReviewSharePage() {
  const { t } = useTranslation();
  return (
    <>
      <Meta
        noIndex
        title={t("page.monthlyReviewShare.title")}
        description={t("page.monthlyReviewShare.desc")}
        ogImage={`${SITE_URL}${API_V2_PREFIX}/site/ogp-sample`}
      />
      <DashboardLayout>
        <MonthlyReviewShare />
      </DashboardLayout>
    </>
  );
}
