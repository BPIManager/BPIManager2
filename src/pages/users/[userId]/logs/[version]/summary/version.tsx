import { DashboardLayout } from "@/components/partials/Main";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/Profile/Meta/ui";
import { PageHeader, PageContainer } from "@/components/partials/Header";
import { getVersionNameFromNumber } from "@/constants/versions";
import { useUser } from "@/contexts/users/UserContext";
import { PageLoader } from "@/components/ui/loading-spinner";
import { useRouter } from "next/router";
import { VersionCompareContent } from "@/components/partials/Logs/VersionCompare/ui";

export default function VersionSummaryPage() {
  const { fbUser, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { userId, version } = router.query;
  const isOwnProfile = fbUser?.uid === userId;
  const isInitialLoading = !router.isReady || isUserLoading;

  if (isInitialLoading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  const versionStr = version as string;

  if (isOwnProfile) {
    return (
      <DashboardLayout>
        <PageHeader
          title={`${getVersionNameFromNumber(versionStr)}のプレイデータまとめ`}
          description="前作との比較を表示しています"
        />
        <PageContainer>
          <VersionCompareContent
            userId={userId as string}
            version={versionStr}
          />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <UserProfileLayout userId={userId as string} currentTab="logs">
      <ProfileMeta
        title={`${getVersionNameFromNumber(versionStr)} バージョン比較`}
        description={`$userName$さん($iidxid$)のbeatmaniaIIDX ${getVersionNameFromNumber(versionStr)}と前作のスコア比較です。`}
      />
      <div className="p-4">
        <VersionCompareContent
          isPublicPage
          userId={userId as string}
          version={versionStr}
        />
      </div>
    </UserProfileLayout>
  );
}
