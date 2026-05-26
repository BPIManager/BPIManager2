"use client";

import { DashboardLayout } from "@/components/partials/Main";
import { Meta } from "@/components/partials/Head";
import { RivalListContainer } from "@/components/partials/Rivals/List";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function RivalsPage() {
  const { t } = useTranslation();
  return (
    <DashboardLayout>
      <Meta
        title={t("page.rivals.title")}
        description={t("page.rivals.desc")}
        noIndex
      />

      <RivalListContainer />
    </DashboardLayout>
  );
}
