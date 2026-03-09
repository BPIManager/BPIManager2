// pages/user/[userId]/logs/[version].tsx
import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { LogsList } from "@/components/partials/Logs/LogsList/ui";
import { LogVersionSelector } from "@/components/partials/Logs/VersionSelector.tsx/ui";
import { Box, VStack } from "@chakra-ui/react";
import { Meta } from "@/components/partials/Head";
import { PageHeader, PageContainer } from "@/components/partials/Header";
import { DashboardLayout } from "@/components/partials/Main";
import { latestVersion } from "@/constants/latestVersion";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";

export default function LogsPage() {
  const router = useRouter();
  const { fbUser, isLoading: isUserLoading } = useUser();

  const { userId, version } = router.query;
  const uid = (userId as string) || "";
  const v = (version as string) || latestVersion;

  const isOwnedByFbId = fbUser?.uid === userId;

  const logsContent = (
    <VStack align="stretch" gap={4}>
      <Box
        bg={isOwnedByFbId ? "transparent" : "#0d1117"}
        borderRadius="2xl"
        border={isOwnedByFbId ? "none" : "1px solid"}
        borderColor="whiteAlpha.100"
        p={isOwnedByFbId ? 0 : 6}
      >
        <LogVersionSelector version={v} />
        <Box mt={6}>
          <LogsList userId={uid} version={v} />
        </Box>
      </Box>
    </VStack>
  );

  if (isUserLoading) return null;

  if (isOwnedByFbId) {
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
      <Meta title="更新履歴" />
      {logsContent}
    </UserProfileLayout>
  );
}
