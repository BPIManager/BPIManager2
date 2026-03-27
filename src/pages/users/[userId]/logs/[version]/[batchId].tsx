import { Meta } from "@/components/partials/Head";
import { LogsDetailContent } from "@/components/partials/Logs/LogsDetail/content";
import { LogsDetailView } from "@/components/partials/Logs/LogsDetail";
import { DashboardLayout } from "@/components/partials/Main";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/Profile/Meta/ui";
import { useUser } from "@/contexts/users/UserContext";
import { Loader } from "lucide-react";
import { useRouter } from "next/router";

export default function BatchLogsPage() {
  const { fbUser, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { userId, version, batchId } = router.query;
  const isOwnProfile = fbUser?.uid === userId;
  const isInitialLoading = !router.isReady || isUserLoading;

  if (isInitialLoading) {
    return (
      <div className="flex h-[90vh] w-full items-center justify-center">
        <Loader className="h-10 w-10 animate-spin text-bpim-text" />
      </div>
    );
  }

  if (isOwnProfile) {
    return (
      <DashboardLayout>
        <Meta title={`プレイログ: ${batchId}`} noIndex />
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
      <ProfileMeta title={`プレイログ: ${batchId}`} />
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
