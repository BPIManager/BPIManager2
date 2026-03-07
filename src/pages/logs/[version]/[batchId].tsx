import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { Meta } from "@/components/partials/Head";
import { DashboardLayout } from "@/components/partials/Main";
import { BatchDetailView } from "@/components/partials/Logs/LogsDetail/ui";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";
import { Center, Spinner } from "@chakra-ui/react";
import { PageContainer } from "@/components/partials/Header";

export default function LogsPage() {
  const router = useRouter();
  const { isLoading: isUserLoading, fbUser } = useUser();

  const version = (router.query.version as string) || undefined;
  const batchId = (router.query.batchId as string) || undefined;

  if (isUserLoading)
    return (
      <Center h="90vh">
        <Spinner />
      </Center>
    );

  return (
    <DashboardLayout>
      <Meta title="更新ログ" noIndex />

      <BatchDetailView
        userId={fbUser?.uid}
        version={version}
        batchId={batchId}
      />
      {!fbUser && (
        <PageContainer>
          <LoginRequiredCard />
        </PageContainer>
      )}
    </DashboardLayout>
  );
}
