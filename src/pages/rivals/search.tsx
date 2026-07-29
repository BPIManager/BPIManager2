import { DashboardLayout } from "@/components/partials/shell/DashboardLayout";
import { Meta } from "@/components/partials/common/Head";
import { UserRecommendationList } from "@/components/partials/common/UserList";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function UsersPage() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <Meta
        title={t("page.search.title")}
        description={t("page.search.desc")}
        noIndex
      />

      <UserRecommendationList />
    </DashboardLayout>
  );
}
