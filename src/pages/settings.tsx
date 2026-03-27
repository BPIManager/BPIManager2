"use client";

import { useUser } from "@/contexts/users/UserContext";
import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import TransferUi from "@/components/partials/Settings/Transfer/ui";
import AccountSettingsUi from "@/components/partials/Settings/AccountSettings/ui";
import AccountDeletionUi from "@/components/partials/Settings/AccountDeletion/ui";
import ApiKeyUi from "@/components/partials/Settings/APIKey/ui";
import LoginPage from "@/components/partials/LogIn/ui";
import { Meta } from "@/components/partials/Head";
import { Loader } from "lucide-react";
import ThemeSettingsUi from "@/components/partials/Settings/ThemeSettings/ui";
import DataExportUi from "@/components/partials/Settings/DataExport";

export default function SettingsPage() {
  const { user, isLoading, fbUser } = useUser();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[90vh] w-full items-center justify-center">
          <Loader className="h-10 w-10 animate-spin text-bpim-text" />
        </div>
      </DashboardLayout>
    );
  }

  if (!fbUser) {
    return <LoginPage />;
  }

  return (
    <DashboardLayout>
      <Meta noIndex title="設定" />

      <PageHeader
        title="設定"
        description="アカウントとデータの管理を行います。"
      />

      <PageContainer>
        <div className="flex flex-col gap-6">
          <AccountSettingsUi />
          <TransferUi />

          <ApiKeyUi />

          <ThemeSettingsUi />
          <DataExportUi />
          <AccountDeletionUi />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
