import { useRouter } from "next/router";
import { Container, Spinner, Center } from "@chakra-ui/react";
import { Meta } from "@/components/partials/Head";
import { DashboardLayout } from "@/components/partials/Main";
import { useUser } from "@/contexts/users/UserContext";
import LoginPage from "@/components/partials/LogIn/page";
import AccountSettings from "@/components/partials/Modal/AccountSettings";
import { SongsTable } from "@/components/partials/Table";

export default function MyScoresByVersion() {
  const router = useRouter();
  const { version } = router.query;
  const { user, isLoading: isUserLoading, fbUser } = useUser();

  const isReady = router.isReady && !isUserLoading;

  if (!isReady) {
    return (
      <Center h="90vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!fbUser) {
    return <LoginPage />;
  }

  const targetVersion = typeof version === "string" ? version : undefined;

  return (
    <>
      {!user && <AccountSettings />}

      <Meta noIndex title={`マイスコア - Version ${targetVersion || ""}`} />

      <DashboardLayout>
        <SongsTable userId={fbUser.uid} version={targetVersion} />
      </DashboardLayout>
    </>
  );
}
