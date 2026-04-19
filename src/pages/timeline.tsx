import { DashboardLayout } from "@/components/partials/Main";
import { Meta } from "@/components/partials/Head";
import { TimelineContainer } from "@/components/partials/Timeline";

export default function UsersPage() {
  return (
    <DashboardLayout>
      <Meta
        title="タイムライン"
        description="アリーナ平均やAAA達成難易度表など、IIDXスコアに関する指標データを閲覧できます。"
      />

      <TimelineContainer />
    </DashboardLayout>
  );
}
