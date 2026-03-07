import { DashboardLayout } from "@/components/partials/Main";
import { useUser } from "@/contexts/users/UserContext";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import TransferUi from "@/components/partials/Settings/Transfer/ui";
import AccountSettingsUi from "@/components/partials/Settings/AccountSettings/ui";
import AccountDeletionUi from "@/components/partials/Settings/AccountDeletion/ui";
import LoginPage from "@/components/partials/LogIn/page";
import { Center, Spinner } from "@chakra-ui/react";
import { Meta } from "@/components/partials/Head";

export default function SettingsPage() {
  const { user, isLoading, fbUser } = useUser();

  if (isLoading) {
    return (
      <Center h="90vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!fbUser) {
    return <LoginPage />;
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="設定"
        description="アカウントとデータの管理を行います。"
      />
      <Meta noIndex title="設定" />

      <PageContainer>
        <AccountSettingsUi />
        <TransferUi />
        <AccountDeletionUi />
      </PageContainer>
    </DashboardLayout>
  );
}
