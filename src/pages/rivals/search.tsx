import { DashboardLayout } from "@/components/partials/Main";
import { Meta } from "@/components/partials/Head";
import { UserRecommendationList } from "@/components/partials/UserList";
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
