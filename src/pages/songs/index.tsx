import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta, JsonLd } from "@/components/partials/Head";
import { SongListContent } from "@/components/partials/Songs/SongList";

const BASE_URL = "https://bpi2.poyashi.me";

const SONGS_JSONLD = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "楽曲情報 | BPIM2",
  description:
    "beatmania IIDX の楽曲メタ情報・難易度属性（皿・ソフラン・CN・物量など）の一覧と検索。",
  url: `${BASE_URL}/songs`,
  isPartOf: {
    "@type": "WebSite",
    name: "BPIM2",
    url: BASE_URL,
  },
  about: {
    "@type": "VideoGame",
    name: "beatmania IIDX",
  },
};

export default function SongsPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="楽曲情報"
        description="楽曲メタ情報・属性の一覧と検索"
      />
      <Meta
        title="楽曲情報"
        description="beatmania IIDX の楽曲メタ情報・難易度属性（皿・ソフラン・CN・物量など）の一覧と検索。"
      />
      <JsonLd data={SONGS_JSONLD} />
      <PageContainer>
        <SongListContent />
      </PageContainer>
    </DashboardLayout>
  );
}
