"use client";

import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { RivalListContainer } from "@/components/partials/Rivals/List";

export default function RivalsPage() {
  return (
    <DashboardLayout>
      <PageHeader title="ライバル" description="ライバル一覧・全体ランキング" />
      <Meta
        title="ライバル"
        description="ライバル一覧・全体ランキング"
        noIndex
      />

      <PageContainer>
        <RivalListContainer />
      </PageContainer>
    </DashboardLayout>
  );
}
