"use client";

import { DashboardLayout } from "@/components/partials/Main";
import { Meta } from "@/components/partials/Head";
import { GlobalRankingContainer } from "@/components/partials/Ranking";

export default function RivalsPage() {
  return (
    <DashboardLayout>
      <Meta
        title="全体ランキング"
        description="BPIM2登録ユーザー内での総合BPIランキング"
        noIndex
      />

      <GlobalRankingContainer />
    </DashboardLayout>
  );
}
