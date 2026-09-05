import { Meta } from "@/components/partials/common/PageChrome/Head";
import DashboardLayout from "@/components/partials/shell/DashboardLayout";
import { LoginRequiredCard } from "@/components/partials/common/Auth/LoginRequired/ui";
import { PageLoader } from "@/components/ui/loading-spinner";
import { useUser } from "@/contexts/users/UserContext";
import { useTranslation } from "@/hooks/common/useTranslation";
import NewBpiComparison from "@/components/partials/features/NewBpiComparison";

/**
 * issue #299〜304（単曲BPIの分布ベース再定義）の検証用ページ。
 * 自分のスコアで現行BPIと新方式BPIを楽曲ごとに見比べられる。
 */
export default function NewBpiPage() {
  const { t } = useTranslation();
  const { isLoading: isUserLoading, fbUser } = useUser();

  if (isUserLoading) {
    return <PageLoader />;
  }

  return (
    <>
      <Meta noIndex title={t("page.newBpi.title")} />
      <DashboardLayout>
        {!fbUser?.uid ? (
          <LoginRequiredCard />
        ) : (
          <NewBpiComparison userId={fbUser.uid} />
        )}
      </DashboardLayout>
    </>
  );
}
