import { DashboardLayout } from "@/components/partials/Main";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/Profile/Meta/ui";
import { PageHeader, PageContainer } from "@/components/partials/Header";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import { useUser } from "@/contexts/users/UserContext";
import { PageLoader } from "@/components/ui/loading-spinner";
import { useRouter } from "next/router";
import { VersionCompareContent } from "@/components/partials/Logs/VersionCompare/ui";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function VersionSummaryPage() {
  const { fbUser, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { userId, version } = router.query;
  const isOwnProfile = fbUser?.uid === userId;
  const isInitialLoading = !router.isReady || isUserLoading;
  const { t } = useTranslation();

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
          title={`${getVersionNameFromNumber(versionStr)}${t("page.versionSummary.titleSuffix")}`}
          description={t("page.versionSummary.desc")}
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
        title={`${getVersionNameFromNumber(versionStr)}${t("page.versionSummary.titleSuffix")}`}
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
