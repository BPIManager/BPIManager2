"use client";

import { useUser } from "@/contexts/users/UserContext";
import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import TransferUi from "@/components/partials/Settings/Transfer/ui";
import AccountSettingsUi from "@/components/partials/Settings/AccountSettings/ui";
import AccountDeletionUi from "@/components/partials/Settings/AccountDeletion/ui";
import ApiKeyUi from "@/components/partials/Settings/APIKey/ui";
import { Meta } from "@/components/partials/Head";
import { PageLoader } from "@/components/ui/loading-spinner";
import ThemeSettingsUi from "@/components/partials/Settings/ThemeSettings/ui";
import DataExportUi from "@/components/partials/Settings/DataExport";
import LayoutSettingsUi from "@/components/partials/Settings/LayoutSettings/ui";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";

export default function SettingsPage() {
  const { isLoading, fbUser } = useUser();

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Meta noIndex title="設定" />
      {fbUser ? (
        <>
          <PageHeader
            title="設定"
            description="アカウントとデータの管理を行います。"
          />

          <PageContainer>
            <div className="flex flex-col gap-6">
              <AccountSettingsUi />
              <TransferUi />

              <ApiKeyUi />

              <LayoutSettingsUi />
              <ThemeSettingsUi />
              <DataExportUi />
              <AccountDeletionUi />
            </div>
          </PageContainer>
        </>
      ) : (
        <LoginRequiredCard />
      )}
    </DashboardLayout>
  );
}
