import { Container, Spinner, Center } from "@chakra-ui/react";
import { Meta } from "@/components/partials/Head";
import { DashboardLayout } from "@/components/partials/Main";
import { useUser } from "@/contexts/users/UserContext";
import LoginPage from "@/components/partials/LogIn/page";
import AccountSettings from "@/components/partials/Modal/accountSettings";
import { SongsTable } from "@/components/partials/Table";

export default function MyScores() {
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
    <>
      {!user && <AccountSettings />}

      <Meta noIndex title="マイスコア" />

      <DashboardLayout>
        <SongsTable userId={fbUser.uid} version="33" />
      </DashboardLayout>
    </>
  );
}
