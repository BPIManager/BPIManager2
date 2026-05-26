import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta, JsonLd } from "@/components/partials/Head";
import { SongListContent } from "@/components/partials/Songs/SongList";
import { RecentNotesList } from "@/components/partials/Songs/RecentNotesList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/common/useTranslation";

const BASE_URL = "https://bpi2.poyashi.me";

const SONGS_JSONLD = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "楽曲情報 | BPIM2",
  description:
    "beatmania IIDX の楽曲メタ情報・難易度属性（皿・ソフラン・CN・物量など）の一覧と検索。当たり譜面検索や攻略情報も自由に書き込みできます。",
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
  const { t } = useTranslation();
  return (
    <DashboardLayout>
      <PageHeader
        title={t("page.songs.title")}
        description={t("page.songs.desc")}
      />
      <Meta
        title={t("page.songs.title")}
        description="beatmania IIDX の楽曲メタ情報・難易度属性（皿・ソフラン・CN・物量など）の一覧と検索。当たり譜面検索や攻略情報も自由に書き込みできます。"
      />
      <JsonLd data={SONGS_JSONLD} />
      <PageContainer>
        <div className="hidden md:grid md:grid-cols-[2fr_1fr] md:gap-6 md:items-start">
          <SongListContent />
          <RecentNotesList />
        </div>

        <div className="md:hidden">
          <Tabs defaultValue="songs">
            <TabsList>
              <TabsTrigger value="songs">{t("page.songs.search")}</TabsTrigger>
              <TabsTrigger value="notes">{t("page.songs.comments")}</TabsTrigger>
            </TabsList>
            <TabsContent value="songs">
              <SongListContent />
            </TabsContent>
            <TabsContent value="notes">
              <RecentNotesList />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
