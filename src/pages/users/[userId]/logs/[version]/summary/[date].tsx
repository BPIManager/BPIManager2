import { LogsDetailContent } from "@/components/partials/Logs/LogsDetail/content";
import { LogsDetailView } from "@/components/partials/Logs/LogsDetail/ui";
import { DashboardLayout } from "@/components/partials/Main";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/Profile/Meta/ui";
import { getVersionNameFromNumber } from "@/constants/versions";
import { useUser } from "@/contexts/users/UserContext";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/router";

export default function SummaryLogsPage() {
  const { fbUser, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { userId, version, date } = router.query;
  const isOwnProfile = fbUser?.uid === userId;

  const isInitialLoading = !router.isReady || isUserLoading;

  if (isInitialLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[90vh] w-full items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-200" />
        </div>
      </DashboardLayout>
    );
  }

  if (isOwnProfile) {
    return (
      <DashboardLayout>
        <LogsDetailView
          type="daily"
          userId={userId as string}
          version={version as string}
          date={date as string}
        />
      </DashboardLayout>
    );
  }

  return (
    <UserProfileLayout userId={userId as string} currentTab="logs">
      <ProfileMeta
        title={`${date as string}のプレイ記録まとめ`}
        description={`$userName$さん($iidxid$)が${date as string}にbeatmaniaIIDX ${getVersionNameFromNumber(Number(version))}でプレイしたスコアの記録を確認できます。`}
      />
      <div className="p-4">
        <LogsDetailContent
          isPublicPage
          type="daily"
          userId={userId as string}
          version={version as string}
          date={date as string}
        />
      </div>
    </UserProfileLayout>
  );
}
