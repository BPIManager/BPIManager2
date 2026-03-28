import { useRouter } from "next/router";
import { Meta } from "@/components/partials/Head";
import { DashboardLayout } from "@/components/partials/Main";
import { useUser } from "@/contexts/users/UserContext";
import AccountSettings from "@/components/partials/Modal/AccountSettings";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";
import { PageContainer } from "@/components/partials/Header";
import { PageLoader } from "@/components/ui/loading-spinner";
import { UnplayedSongsTable } from "@/components/partials/TableUnplayed";

export default function UnplayedScoresByVersion() {
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

      <Meta noIndex title={`未プレイ曲 - Version ${targetVersion || ""}`} />

      <DashboardLayout>
        {!fbUser?.uid ? (
          <PageContainer>
            <LoginRequiredCard />
          </PageContainer>
        ) : (
          <UnplayedSongsTable userId={fbUser?.uid} version={targetVersion} />
        )}
      </DashboardLayout>
    </>
  );
}
