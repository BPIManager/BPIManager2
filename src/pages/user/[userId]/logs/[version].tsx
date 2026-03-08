import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { LogsList } from "@/components/partials/Logs/LogsList/ui";
import { LogVersionSelector } from "@/components/partials/Logs/VersionSelector.tsx/ui";
import { Center, HStack, Spinner, VStack } from "@chakra-ui/react";
import { Box, Heading } from "lucide-react";
import { Meta } from "@/components/partials/Head";
import { PageHeader, PageContainer } from "@/components/partials/Header";
import { DashboardLayout } from "@/components/partials/Main";
import { latestVersion } from "@/constants/latestVersion";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";

export default function LogsPage() {
  const router = useRouter();
  const { isLoading: isUserLoading, fbUser } = useUser();

  const version = (router.query.version as string) || latestVersion;

  if (isUserLoading)
    return (
      <Center h="90vh">
        <Spinner />
      </Center>
    );
  return (
    <DashboardLayout>
      <PageHeader title="更新ログ" description="スコアの更新ログと詳細情報" />
      <Meta title="更新ログ" noIndex />

      <PageContainer>
        <LogVersionSelector version={version} />

        <LogsList userId={fbUser?.uid} version={version} />
        {!fbUser && <LoginRequiredCard />}
      </PageContainer>
    </DashboardLayout>
  );
}
