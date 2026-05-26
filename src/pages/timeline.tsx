import { DashboardLayout } from "@/components/partials/Main";
import { Meta } from "@/components/partials/Head";
import { TimelineContainer } from "@/components/partials/Timeline";
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
