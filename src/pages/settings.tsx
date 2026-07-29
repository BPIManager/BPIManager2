"use client";

import { useUser } from "@/contexts/users/UserContext";
import { useTranslation } from "@/hooks/common/useTranslation";
import { DashboardLayout } from "@/components/partials/shell/DashboardLayout";
import { PageContainer, PageHeader } from "@/components/partials/common/Header";
import TransferUi from "@/components/partials/features/Settings/Transfer/ui";
import AccountSettingsUi from "@/components/partials/features/Settings/AccountSettings/ui";
import AccountDeletionUi from "@/components/partials/features/Settings/AccountDeletion/ui";
import ApiKeyUi from "@/components/partials/features/Settings/APIKey/ui";
import { Meta } from "@/components/partials/common/Head";
import { PageLoader } from "@/components/ui/loading-spinner";
import ThemeSettingsUi from "@/components/partials/features/Settings/ThemeSettings/ui";
import DataExportUi from "@/components/partials/features/Settings/DataExport";
import LayoutSettingsUi from "@/components/partials/features/Settings/LayoutSettings/ui";
import LanguageSettingsUi from "@/components/partials/features/Settings/LanguageSettings/ui";
import { RequireAuth } from "@/components/partials/shell/RequireAuth";

export default function SettingsPage() {
  const { isLoading, fbUser } = useUser();
  const { t } = useTranslation();

  return (
    <RequireAuth
      isLoading={isLoading}
      isAuthenticated={!!fbUser}
      loadingFallback={<PageLoader />}
      meta={<Meta noIndex title={t("page.settings.title")} />}
    >
      <DashboardLayout>
        <Meta noIndex title={t("page.settings.title")} />
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
      </DashboardLayout>
    </RequireAuth>
  );
}
