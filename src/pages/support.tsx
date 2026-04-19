"use client";

import { DashboardLayout } from "@/components/partials/Main";
import { Meta } from "@/components/partials/Head";
import { SupportersPage } from "@/components/partials/Supporters";

export default function SupportersPageRoute() {
  return (
    <DashboardLayout>
      <Meta
        title="ご支援のお願い"
        description="BPIM2の継続開発のため、ご支援をお待ちしております"
      />
      <SupportersPage />
    </DashboardLayout>
  );
}
