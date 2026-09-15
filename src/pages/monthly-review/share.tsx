import { Meta } from "@/components/partials/common/PageChrome/Head";
import DashboardLayout from "@/components/partials/shell/DashboardLayout";
import MonthlyReviewShare from "@/components/partials/features/MonthlyReviewShare";
import { useTranslation } from "@/hooks/common/useTranslation";

/**
 * BPIM公式アカウントからの告知用に使い回せる、userIdを含まない共有URL。
 * アクセスしたユーザー自身の「先月のまとめ」ページへ自動でリダイレクトする。
 */
export default function MonthlyReviewSharePage() {
  const { t } = useTranslation();
  return (
    <>
      <Meta noIndex title={t("page.monthlyReviewShare.title")} />
      <DashboardLayout>
        <MonthlyReviewShare />
      </DashboardLayout>
    </>
  );
}
