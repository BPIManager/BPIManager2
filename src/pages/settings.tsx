"use client";

import { useUser } from "@/contexts/users/UserContext";
import { useTranslation } from "@/hooks/common/useTranslation";
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
import LanguageSettingsUi from "@/components/partials/Settings/LanguageSettings/ui";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";

export default function SettingsPage() {
  const { isLoading, fbUser } = useUser();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Meta noIndex title={t("page.settings.title")} />
      {fbUser ? (
        <>
          <PageHeader
            title={t("page.settings.title")}
            description={t("page.settings.desc")}
          />

          <PageContainer>
            <div className="flex flex-col gap-6">
              <AccountSettingsUi />
              <LanguageSettingsUi />
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
