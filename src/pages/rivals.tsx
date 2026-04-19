"use client";

import { DashboardLayout } from "@/components/partials/Main";
import { Meta } from "@/components/partials/Head";
import { RivalListContainer } from "@/components/partials/Rivals/List";

export default function RivalsPage() {
  return (
    <DashboardLayout>
      <Meta
        title="ライバル"
        description="ライバル一覧・全体ランキング"
        noIndex
      />

      <RivalListContainer />
    </DashboardLayout>
  );
}
