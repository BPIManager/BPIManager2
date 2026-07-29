"use client";

import { DashboardLayout } from "@/components/partials/shell/DashboardLayout";
import { Meta } from "@/components/partials/common/Head";
import { SupportersPage } from "@/components/partials/features/Supporters";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function SupportersPageRoute() {
  const { t } = useTranslation();
  return (
    <DashboardLayout>
      <Meta
        title={t("page.support.title")}
        description={t("page.support.desc")}
      />
      <SupportersPage />
    </DashboardLayout>
  );
}
