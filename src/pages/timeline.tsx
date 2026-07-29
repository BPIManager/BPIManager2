import { DashboardLayout } from "@/components/partials/shell/DashboardLayout";
import { Meta } from "@/components/partials/common/Head";
import { TimelineContainer } from "@/components/partials/features/Timeline";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function UsersPage() {
  const { t } = useTranslation();
  return (
    <DashboardLayout>
      <Meta
        title={t("page.timeline.title")}
        description={t("page.timeline.desc")}
      />

      <TimelineContainer />
    </DashboardLayout>
  );
}
