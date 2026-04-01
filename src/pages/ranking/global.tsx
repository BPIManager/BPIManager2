"use client";

import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { useGlobalRanking } from "@/hooks/stats/useGlobalRanking";
import { GlobalRankingContainer } from "@/components/partials/Ranking";

function RivalsPageContent() {
  return <GlobalRankingContainer />;
}

export default function RivalsPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="全体ランキング"
        description="BPIM2登録ユーザー内総合BPIランキング"
      />
      <Meta
        title="全体ランキング"
        description="BPIM2登録ユーザー内での総合BPIランキング"
        noIndex
      />

      <PageContainer>
        <RivalsPageContent />
      </PageContainer>
    </DashboardLayout>
  );
}
