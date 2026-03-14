import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { UserRecommendationList } from "@/components/partials/UserList";

export default function UsersPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="ライバルを探す"
        description="実力が近いユーザーをライバル登録してスコアを競えます"
      />
      <Meta
        title="ライバルを探す"
        description="アリーナ平均やAAA達成難易度表など、IIDXスコアに関する指標データを閲覧できます。"
        noIndex
      />

      <PageContainer>
        <UserRecommendationList />
      </PageContainer>
    </DashboardLayout>
  );
}
