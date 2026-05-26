"use client";

import { DashboardLayout } from "@/components/partials/Main";
import { Meta } from "@/components/partials/Head";
import { GlobalRankingContainer } from "@/components/partials/Ranking";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function RivalsPage() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <Meta
        title={t("page.ranking.title")}
        description={t("page.ranking.metaDesc")}
      />

      <GlobalRankingContainer />
    </DashboardLayout>
  );
}
