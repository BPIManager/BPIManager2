import { useState } from "react";
import {
  Container,
  SimpleGrid,
  VStack,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { DashboardLayout } from "@/components/partials/Main";
import { useUser } from "@/contexts/users/UserContext";
import { Meta } from "@/components/partials/Head";
import LoginPage from "@/components/partials/LogIn/page";
import AccountSettings from "@/components/partials/Modal/AccountSettings";
import { DashBoardFilter } from "@/components/partials/DashBoard/Filter";
import { ActivitySection } from "@/components/partials/DashBoard/ActivityCalendar/ui";
import { RankDistributionSection } from "@/components/partials/DashBoard/DJRankDistribution/ui";
import { BpiDistributionSection } from "@/components/partials/DashBoard/BPIDistribution/ui";
import { FilterProvider } from "@/contexts/stats/FilterContext";
import { TotalBPIHistory } from "@/components/partials/DashBoard/TotalBPIHistory/ui";
import { PageContainer, PageHeader } from "@/components/partials/Header";

export default function DashboardPage() {
  const { user, isLoading: isUserLoading, fbUser } = useUser();

  if (isUserLoading)
    return (
      <Center h="90vh">
        <Spinner />
      </Center>
    );
  if (!fbUser) return <LoginPage />;

  return (
    <FilterProvider>
      <Meta noIndex title="ダッシュボード" />
      {!user && <AccountSettings />}
      <DashboardLayout>
        <PageHeader
          title="ダッシュボード"
          description="おかえりなさい！成長の軌跡を確認しましょう。"
        />
        <PageContainer>
          <VStack align="stretch" gap={6}>
            <DashBoardFilter />

            <ActivitySection userId={fbUser.uid} />

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
              <RankDistributionSection userId={fbUser.uid} />
              <BpiDistributionSection userId={fbUser.uid} />
            </SimpleGrid>

            <TotalBPIHistory userId={fbUser.uid} />
          </VStack>
        </PageContainer>
      </DashboardLayout>
    </FilterProvider>
  );
}
