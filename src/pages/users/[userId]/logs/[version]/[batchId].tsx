import { Meta } from "@/components/partials/Head";
import { LogsDetailContent } from "@/components/partials/Logs/LogsDetail/content";
import { LogsDetailView } from "@/components/partials/Logs/LogsDetail/ui";
import { DashboardLayout } from "@/components/partials/Main";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { ProfileMeta } from "@/components/partials/Profile/Meta/ui";
import { useUser } from "@/contexts/users/UserContext";
import { Box, Center, Spinner } from "@chakra-ui/react";
import { useRouter } from "next/router";

export default function BatchLogsPage() {
  const { fbUser, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { userId, version, batchId } = router.query;
  const isOwnProfile = fbUser?.uid === userId;
  const isInitialLoading = !router.isReady || isUserLoading;

  if (isInitialLoading) {
    return (
      <DashboardLayout>
        <Center>
          <Spinner size="sm" />
        </Center>
      </DashboardLayout>
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
      <Box p={4}>
        <LogsDetailContent
          isPublicPage
          type="batch"
          userId={userId as string}
          version={version as string}
          batchId={batchId as string}
        />
      </Box>
    </UserProfileLayout>
  );
}
