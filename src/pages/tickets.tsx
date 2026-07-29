"use client";

import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { RequireAuth } from "@/components/partials/RequireAuth";
import { useUser } from "@/contexts/users/UserContext";
import { TicketsSection } from "@/components/partials/features/Tickets";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function TicketsPage() {
  const { isLoading: isUserLoading, fbUser } = useUser();
  const { t } = useTranslation();

  return (
    <RequireAuth isLoading={isUserLoading} isAuthenticated={!!fbUser}>
      <DashboardLayout>
        <Meta title={t("page.tickets.title")} noIndex />
        <PageHeader
          title={t("page.tickets.title")}
          description={t("page.tickets.desc")}
        />
        <PageContainer>
          <TicketsSection />
        </PageContainer>
      </DashboardLayout>
    </RequireAuth>
  );
}
