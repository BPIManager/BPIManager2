import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { UserRecommendationList } from "@/components/partials/UserList";
import RivalListContainer from "@/components/partials/Rivals/List";

export default function UsersPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="ライバル一覧"
        description="フォローしているライバル一覧"
      />
      <Meta
        title="ライバル一覧"
        description="フォローしているライバル一覧"
        noIndex
      />

      <PageContainer>
        <RivalListContainer />
      </PageContainer>
    </DashboardLayout>
  );
}
