import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { ReusableMenuItem } from "@/components/partials/Metrics/Menu/ui";
import { Swords, Table } from "lucide-react";
import { latestVersion } from "@/constants/iidx/latestVersion";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <DashboardLayout>
      <PageHeader
        title={t("page.metrics.title")}
        description={t("page.metrics.desc")}
      />
      <Meta
        title={t("page.metrics.title")}
        description={t("page.metrics.desc")}
      />

      <PageContainer>
        <ReusableMenuItem
          href="/metrics/AAADifficultyTable"
          icon={Table}
          title={t("page.metrics.aaaChart")}
          subtitle={<>{t("page.metrics.aaaChartDesc")}</>}
          iconColor="blue.400"
        />
        <ReusableMenuItem
          href={
            "/metrics/arenaAverage/" +
            String(Number(latestVersion) - 1) +
            "?difficultyLevel=12"
          }
          icon={Swords}
          title={t("page.metrics.arenaAverage")}
          subtitle={<>{t("page.metrics.arenaAverageDesc")}</>}
          iconColor="blue.400"
        />
      </PageContainer>
    </DashboardLayout>
  );
}
