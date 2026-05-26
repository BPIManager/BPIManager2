import { DashboardLayout } from "@/components/partials/Main";
import { Meta } from "@/components/partials/Head";
import { useUser } from "@/contexts/users/UserContext";
import { AAATableContent } from "@/components/partials/Metrics/AAATable";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function GlobalAAATablePage() {
  const { fbUser, isLoading } = useUser();
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <Meta
        title={t("page.aaaTable.title")}
        description={t("page.aaaTable.desc")}
      />

      {isLoading ? null : <AAATableContent userId={fbUser ? fbUser.uid : ""} />}
    </DashboardLayout>
  );
}
