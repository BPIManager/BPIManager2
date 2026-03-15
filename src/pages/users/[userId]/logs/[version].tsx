import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { LogsList } from "@/components/partials/Logs/LogsList/ui";
import { Box, VStack } from "@chakra-ui/react";
import { Meta } from "@/components/partials/Head";
import { PageHeader, PageContainer } from "@/components/partials/Header";
import { DashboardLayout } from "@/components/partials/Main";
import { latestVersion } from "@/constants/latestVersion";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/Profile/Meta/ui";
import { getVersionNameFromNumber, versionTitles } from "@/constants/versions";
import { LogFilterSection } from "@/components/partials/Logs/VersionSelector/ui";

export default function LogsPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();

  const { userId, version, groupedBy } = router.query;
  const uid = (userId as string) || "";
  const v = (version as string) || latestVersion;
  const g = (groupedBy as string) || "createdAt";
  const isOwnedByFbId = !isUserLoading && user?.userId === userId;

  const logsContent = (
    <VStack align="stretch" gap={4}>
      <Box
        bg={isOwnedByFbId ? "transparent" : "#0d1117"}
        borderRadius="2xl"
        border={isOwnedByFbId ? "none" : "1px solid"}
        borderColor="whiteAlpha.100"
        p={isOwnedByFbId ? 0 : 6}
      >
        <LogFilterSection version={v} groupedBy={g} />
        <Box mt={6}>
          <LogsList userId={uid} version={v} groupedBy={g} />
        </Box>
      </Box>
    </VStack>
  );

  if (isUserLoading) return null;

  if (isOwnedByFbId && user?.userId !== undefined) {
    return (
      <DashboardLayout>
        <Meta title="更新ログ" noIndex />
        <PageHeader title="更新ログ" description="スコアの更新ログと詳細情報" />
        <PageContainer>{logsContent}</PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <UserProfileLayout userId={uid} currentTab="logs">
      <ProfileMeta
        title={`スコア更新記録`}
        description={`$userName$さん($iidxid$)がbeatmaniaIIDX ${getVersionNameFromNumber(Number(version))}でプレイしたスコアの記録を確認できます。`}
      />
      {logsContent}
    </UserProfileLayout>
  );
}
