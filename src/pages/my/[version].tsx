import { useRouter } from "next/router";
import { Meta } from "@/components/partials/Head";
import { DashboardLayout } from "@/components/partials/Main";
import { useUser } from "@/contexts/users/UserContext";
import AccountSettings from "@/components/partials/Modal/AccountSettings";
import { SongsTable } from "@/components/partials/Table";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";
import { PageLoader } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function MyScoresByVersion() {
  const router = useRouter();
  const { version } = router.query;
  const { user, isLoading: isUserLoading, fbUser } = useUser();
  const { t } = useTranslation();

  const isReady = router.isReady && !isUserLoading;

  if (!isReady) {
    return <PageLoader />;
  }

  const targetVersion = typeof version === "string" ? version : undefined;

  return (
    <>
      {!user && <AccountSettings />}

      <Meta noIndex title={`${t("page.myScores.title")} — Version ${targetVersion || ""}`} />

      <DashboardLayout>
        {!fbUser?.uid ? (
          <LoginRequiredCard />
        ) : (
          <SongsTable userId={fbUser?.uid} version={targetVersion} />
        )}
      </DashboardLayout>
    </>
  );
}
