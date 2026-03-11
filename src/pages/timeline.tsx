import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { TimelineContainer } from "@/components/partials/Timeline";

export default function UsersPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="タイムライン"
        description="フォロー中のユーザーのスコア更新ログ"
      />
      <Meta
        title="タイムライン"
        description="アリーナ平均やAAA達成難易度表など、IIDXスコアに関する指標データを閲覧できます。"
        noIndex
      />

      <PageContainer>
        <TimelineContainer />
      </PageContainer>
    </DashboardLayout>
  );
}
