"use client";

import { DashboardLayout } from "@/components/partials/Main";
import { Meta } from "@/components/partials/Head";
import { SupportersPage } from "@/components/partials/Supporters";
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
