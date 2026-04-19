import { DashboardLayout } from "@/components/partials/Main";
import { Meta } from "@/components/partials/Head";
import { UserRecommendationList } from "@/components/partials/UserList";

export default function UsersPage() {
  return (
    <DashboardLayout>
      <Meta
        title="ライバルを探す"
        description="アリーナ平均やAAA達成難易度表など、IIDXスコアに関する指標データを閲覧できます。"
        noIndex
      />

      <UserRecommendationList />
    </DashboardLayout>
  );
}
