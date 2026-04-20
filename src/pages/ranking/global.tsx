"use client";

import { DashboardLayout } from "@/components/partials/Main";
import { Meta } from "@/components/partials/Head";
import { GlobalRankingContainer } from "@/components/partials/Ranking";

export default function RivalsPage() {
  return (
    <DashboardLayout>
      <Meta
        title="全体ランキング"
        description="総合BPIランキング・個別楽曲ランキング・IIDXタワーランキングなどの各種ランキングを提供"
      />

      <GlobalRankingContainer />
    </DashboardLayout>
  );
}
