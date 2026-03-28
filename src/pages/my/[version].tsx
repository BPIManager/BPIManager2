import { useRouter } from "next/router";
import { Meta } from "@/components/partials/Head";
import { DashboardLayout } from "@/components/partials/Main";
import { useUser } from "@/contexts/users/UserContext";
import AccountSettings from "@/components/partials/Modal/AccountSettings";
import { SongsTable } from "@/components/partials/Table";
import {
  LoginRequiredBox,
  LoginRequiredCard,
} from "@/components/partials/LoginRequired/ui";
import { PageContainer } from "@/components/partials/Header";
import { PageLoader } from "@/components/ui/loading-spinner";

export default function MyScoresByVersion() {
  const router = useRouter();
  const { version } = router.query;
  const { user, isLoading: isUserLoading, fbUser } = useUser();

  const isReady = router.isReady && !isUserLoading;

  if (!isReady) {
    return (
      <PageLoader />
    );
  }

  const targetVersion = typeof version === "string" ? version : undefined;

  return (
    <>
      {!user && <AccountSettings />}

      <Meta noIndex title={`マイスコア - Version ${targetVersion || ""}`} />

      <DashboardLayout>
        {!fbUser?.uid ? (
          <PageContainer>
            <LoginRequiredCard />
          </PageContainer>
        ) : (
          <SongsTable userId={fbUser?.uid} version={targetVersion} />
        )}
      </DashboardLayout>
    </>
  );
}
