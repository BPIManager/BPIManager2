"use client";

import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { RequireAuth } from "@/components/partials/RequireAuth";
import { useUser } from "@/contexts/users/UserContext";
import { BpiOptimizerSection } from "@/components/partials/Analytics/BpiOptimizer";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function BpiOptimizerPage() {
  const { isLoading: isUserLoading, fbUser } = useUser();
  const { t } = useTranslation();

  return (
    <RequireAuth isLoading={isUserLoading} isAuthenticated={!!fbUser}>
      <DashboardLayout>
        <Meta title={t("page.optimizer.title")} noIndex />

        <PageHeader
          title={t("page.optimizer.title")}
          description={t("page.optimizer.desc")}
        />

        <PageContainer>
          <BpiOptimizerSection />
        </PageContainer>
      </DashboardLayout>
    </RequireAuth>
  );
}
