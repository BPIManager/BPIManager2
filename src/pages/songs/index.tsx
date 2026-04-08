import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { SongListContent } from "@/components/partials/Songs/SongListContent";

export default function SongsPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="楽曲情報"
        description="楽曲メタ情報・属性の一覧と検索"
      />
      <Meta
        title="楽曲情報"
        description="beatmania IIDX 楽曲メタ情報・属性一覧"
        noIndex
      />
      <PageContainer>
        <SongListContent />
      </PageContainer>
    </DashboardLayout>
  );
}
