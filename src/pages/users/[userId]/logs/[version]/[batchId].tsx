import { Meta } from "@/components/partials/Head";
import { LogsDetailContent } from "@/components/partials/Logs/LogsDetail/content";
import { LogsDetailView } from "@/components/partials/Logs/LogsDetail";
import { DashboardLayout } from "@/components/partials/Main";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/Profile/Meta/ui";
import { useUser } from "@/contexts/users/UserContext";
import { PageLoader } from "@/components/ui/loading-spinner";
import { useRouter } from "next/router";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function BatchLogsPage() {
  const { fbUser, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { userId, version, batchId } = router.query;
  const isOwnProfile = fbUser?.uid === userId;
  const isInitialLoading = !router.isReady || isUserLoading;
  const { t } = useTranslation();

  if (isInitialLoading) {
    return <PageLoader />;
  }

  if (isOwnProfile) {
    return (
      <DashboardLayout>
        <Meta title={`${t("page.batchLog.titlePrefix")}${batchId}`} noIndex />
        <LogsDetailView
          type="batch"
          userId={userId}
          version={version as string}
          batchId={batchId as string}
        />
      </DashboardLayout>
    );
  }

  return (
    <UserProfileLayout userId={userId as string} currentTab="logs">
      <ProfileMeta title={`${t("page.batchLog.titlePrefix")}${batchId}`} />
      <div className="p-4">
        <LogsDetailContent
          isPublicPage
          type="batch"
          userId={userId as string}
          version={version as string}
          batchId={batchId as string}
        />
      </div>
    </UserProfileLayout>
  );
}
