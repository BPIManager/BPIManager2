import { Meta } from "@/components/partials/common/PageChrome/Head";
import DashboardLayout from "@/components/partials/shell/DashboardLayout";
import MonthlyReviewShare from "@/components/partials/features/MonthlyReviewShare";
import { useTranslation } from "@/hooks/common/useTranslation";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";

/**
 * BPIM公式アカウントからの告知用に使い回せる、userIdを含まない共有URL。
 * アクセスしたユーザー自身の「先月のまとめ」ページへ自動でリダイレクトする。
 * userId未確定のためog:imageは実データを使えず、架空データのサンプルOGP
 * （LoginPage・index.tsxと同じ/api/v2/site/ogp-sample）を使う。
 */
export default function MonthlyReviewSharePage() {
  const { t } = useTranslation();
  return (
    <>
      <Meta
        noIndex
        title={t("page.monthlyReviewShare.title")}
        description={t("page.monthlyReviewShare.desc")}
        ogImage={`https://bpi2.poyashi.me${API_V2_PREFIX}/site/ogp-sample`}
      />
      <DashboardLayout>
        <MonthlyReviewShare />
      </DashboardLayout>
    </>
  );
}
