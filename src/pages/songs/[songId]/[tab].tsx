import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { SongDetailContent } from "@/components/partials/Songs/SongDetail/SongDetailContent";

const VALID_TABS = ["ranking", "similar", "notes", "pattern"] as const;
type Tab = (typeof VALID_TABS)[number];

interface Props {
  tab: Tab;
}

export default function SongDetailPage({ tab }: Props) {
  const router = useRouter();
  const rawSongId = router.query.songId;
  const songId = rawSongId ? parseInt(String(rawSongId), 10) : null;

  return (
    <DashboardLayout>
      <Meta
        title="楽曲詳細"
        description="beatmania IIDX 楽曲詳細情報"
        noIndex
      />
      <PageContainer>
        {songId !== null && !isNaN(songId) ? (
          <SongDetailContent songId={songId} activeTab={tab} />
        ) : (
          <div className="py-16 text-center text-sm text-bpim-muted">
            楽曲が見つかりませんでした
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({
  params,
}) => {
  const tab = params?.tab;
  if (
    !tab ||
    Array.isArray(tab) ||
    !(VALID_TABS as readonly string[]).includes(tab)
  ) {
    const songId = params?.songId;
    return {
      redirect: {
        destination: `/songs/${songId}/notes`,
        permanent: false,
      },
    };
  }
  return { props: { tab: tab as Tab } };
};
