"use client";

import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";
import { useUser } from "@/contexts/users/UserContext";
import { BpiOptimizerSection } from "@/components/partials/Analytics/BpiOptimizer";

export default function BpiOptimizerPage() {
  const { isLoading: isUserLoading, fbUser } = useUser();

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
        <PageContainer>
          <LoginRequiredCard />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Meta title="総合BPIを伸ばす" noIndex />

      <PageHeader
        title="総合BPIを伸ばす"
        description="目標総合BPIに到達するためのトレーニングセットを見つける"
      />

      <PageContainer>
        <BpiOptimizerSection />
      </PageContainer>
    </DashboardLayout>
  );
}
