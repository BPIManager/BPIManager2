import { LogsDetailContent } from "@/components/partials/Logs/LogsDetail/content";
import { LogsDetailView } from "@/components/partials/Logs/LogsDetail";
import { DashboardLayout } from "@/components/partials/Main";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/Profile/Meta/ui";
import { getVersionNameFromNumber } from "@/constants/versions";
import { useUser } from "@/contexts/users/UserContext";
import { PageLoader } from "@/components/ui/loading-spinner";
import { useRouter } from "next/router";
import dayjs from "@/lib/dayjs";

export default function WeeklyLogsPage() {
  const { fbUser, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { userId, version, date } = router.query;
  const isOwnProfile = fbUser?.uid === userId;
  const isInitialLoading = !router.isReady || isUserLoading;

  if (isInitialLoading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  const dateStr = date as string;
  const weekLabel = dateStr
    ? (() => {
        const d = dayjs.tz(dateStr);
        return `${d.startOf("isoWeek").format("M月D日")}〜${d.endOf("isoWeek").format("M月D日")}`;
      })()
    : "";

  if (isOwnProfile) {
    return (
      <DashboardLayout>
        <LogsDetailView
          type="weekly"
          userId={userId as string}
          version={version as string}
          date={dateStr}
        />
      </DashboardLayout>
    );
  }

  return (
    <UserProfileLayout userId={userId as string} currentTab="logs">
      <ProfileMeta
        title={`${weekLabel}のプレイ記録まとめ`}
        description={`$userName$さん($iidxid$)が${weekLabel}にbeatmaniaIIDX ${getVersionNameFromNumber(Number(version))}でプレイしたスコアの記録を確認できます。`}
      />
      <div className="p-4">
        <LogsDetailContent
          isPublicPage
          type="weekly"
          userId={userId as string}
          version={version as string}
          date={dateStr}
        />
      </div>
    </UserProfileLayout>
  );
}
