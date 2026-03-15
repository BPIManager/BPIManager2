import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { DashboardLayout } from "@/components/partials/Main";
import { PageHeader, PageContainer } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { Box } from "@chakra-ui/react";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { AAATableContent } from "@/components/partials/Metrics/AAATable/content";
import { latestVersion } from "@/constants/latestVersion";
import { useStaticProfile } from "@/contexts/profile/ProfileContext";
import { ProfileMeta } from "@/components/partials/Profile/Meta/ui";
import { DashCard } from "@/components/ui/dashcard";

export default function UserAAATablePage() {
  const router = useRouter();
  const { fbUser, isLoading: isUserLoading } = useUser();

  const { userId, version } = router.query;
  const uid = (userId as string) || "";
  const v = (version as string) || latestVersion;

  const isOwnedByFbId = fbUser?.uid === userId;

  if (!router.isReady || isUserLoading) return null;

  if (isOwnedByFbId) {
    return (
      <DashboardLayout>
        <PageHeader
          title="AAA達成難易度表"
          description="自分自身の達成状況を確認"
        />
        <Meta title="AAA達成難易度表" noIndex />
        <PageContainer>
          <AAATableContent userId={uid} />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <UserProfileLayout userId={uid} currentTab="aaaTable">
      <ProfileMeta title="AAA達成難易度表" />
      <DashCard>
        <AAATableContent userId={uid} defaultVersion={v} />
      </DashCard>
    </UserProfileLayout>
  );
}
