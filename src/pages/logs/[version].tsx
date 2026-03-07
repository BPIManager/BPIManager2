import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { LogsList } from "@/components/partials/Logs/LogsList/ui";
import { LogVersionSelector } from "@/components/partials/Logs/VersionSelector.tsx/ui";
import { HStack, VStack } from "@chakra-ui/react";
import { Box, Heading } from "lucide-react";
import { Meta } from "@/components/partials/Head";
import { PageHeader, PageContainer } from "@/components/partials/Header";
import { DashboardLayout } from "@/components/partials/Main";
import { latestVersion } from "@/constants/latestVersion";

export default function LogsPage() {
  const router = useRouter();
  const { user } = useUser();

  const version = (router.query.version as string) || latestVersion;

  return (
    <DashboardLayout>
      <PageHeader title="更新ログ" description="スコアの更新ログと詳細情報" />
      <Meta title="更新ログ" noIndex />

      <PageContainer>
        <LogVersionSelector version={version} />

        <LogsList userId={user?.userId} version={version} />
      </PageContainer>
    </DashboardLayout>
  );
}
