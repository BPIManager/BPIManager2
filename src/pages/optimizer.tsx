"use client";

import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";
import { useUser } from "@/contexts/users/UserContext";
import { BpiOptimizerSection } from "@/components/partials/Analytics/BpiOptimizer";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function BpiOptimizerPage() {
  const { isLoading: isUserLoading, fbUser } = useUser();
  const { t } = useTranslation();

  if (isUserLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[90vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-bpim-border border-t-bpim-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!fbUser) {
    return (
      <DashboardLayout>
        <LoginRequiredCard />
      </DashboardLayout>
    );
  }

  return (
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
  );
}
