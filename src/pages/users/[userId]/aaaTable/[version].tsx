import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { DashboardLayout } from "@/components/partials/shell/DashboardLayout";
import { Meta } from "@/components/partials/common/PageChrome/Head";
import { UserProfileLayout } from "@/components/partials/common/Profile/Layout/layout";
import { AAATableContent } from "@/components/partials/common/Metrics/AAATable";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { ProfileMeta } from "@/components/partials/common/Profile/Meta/ui";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/common/useTranslation";
import { useIsOwnProfile } from "@/hooks/users/useIsOwnProfile";

export default function UserAAATablePage() {
  const router = useRouter();
  const { isLoading: isUserLoading } = useUser();
  const { t } = useTranslation();

  const { userId, version } = router.query;
  const uid = (userId as string) || "";
  const v = (version as string) || latestVersion;

  const isOwnedByFbId = useIsOwnProfile(userId);

  if (!router.isReady || isUserLoading) return null;

  if (isOwnedByFbId) {
    return (
      <DashboardLayout>
        <Meta title={t("page.aaaTable.title")} noIndex />
        <AAATableContent userId={uid} />
      </DashboardLayout>
    );
  }

  return (
    <UserProfileLayout userId={uid} currentTab="aaaTable">
      <ProfileMeta title={t("page.aaaTable.title")} />
      <div className="flex flex-col gap-4">
        <div
          className={cn(
            "rounded-2xl transition-all",
            "border border-bpim-border bg-bpim-bg/40 p-4 md:p-6 shadow-xl backdrop-blur-md",
          )}
        >
          <AAATableContent userId={uid} defaultVersion={v} isSelf={false} />
        </div>
      </div>
    </UserProfileLayout>
  );
}
