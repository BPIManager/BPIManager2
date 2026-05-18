"use client";

import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";
import { useUser } from "@/contexts/users/UserContext";
import { TicketsSection } from "@/components/partials/Tickets";

export default function TicketsPage() {
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
        <LoginRequiredCard />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Meta title="ランダムレーンチケット当たり探索" noIndex />
      <PageHeader
        title="ランダムレーンチケット当たり探索"
        description="チケット番号から当たり譜面をレコメンドします"
      />
      <PageContainer>
        <TicketsSection />
      </PageContainer>
    </DashboardLayout>
  );
}
