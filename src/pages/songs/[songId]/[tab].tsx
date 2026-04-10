import type { GetServerSideProps } from "next";
import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer } from "@/components/partials/Header";
import { Meta, JsonLd } from "@/components/partials/Head";
import { SongDetailContent } from "@/components/partials/Songs/SongDetail";
import { songsRepo } from "@/lib/db/songs";

const VALID_TABS = ["ranking", "similar", "notes", "pattern"] as const;
type Tab = (typeof VALID_TABS)[number];

const TAB_META: Record<Tab, { label: string; descSuffix: string; schemaType: string }> = {
  notes: {
    label: "攻略メモ",
    descSuffix: "の攻略メモ・譜面傾向",
    schemaType: "Article",
  },
  similar: {
    label: "類似楽曲",
    descSuffix: "に譜面傾向が似ている楽曲一覧。",
    schemaType: "ItemList",
  },
  ranking: {
    label: "ランキング",
    descSuffix: "のBPIM2登録ユーザー内スコアランキング",
    schemaType: "Dataset",
  },
  pattern: {
    label: "当たり譜面",
    descSuffix: "の当たり譜面一覧（独自の譜面解析に基づく）。",
    schemaType: "Article",
  },
};

interface SongMeta {
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  bpm: string;
}

interface Props {
  tab: Tab;
  songId: number;
  songMeta: SongMeta | null;
}

const BASE_URL = "https://bpi2.poyashi.me";

export default function SongDetailPage({ tab, songId, songMeta }: Props) {
  const { label, descSuffix, schemaType } = TAB_META[tab];

  const songLabel = songMeta
    ? `\u2606${songMeta.difficultyLevel} ${songMeta.title}(SP${songMeta.difficulty.slice(0,1)})`
    : "楽曲詳細";

  const pageTitle = `${songLabel} - ${label}`;
  const description = songMeta
    ? `${songMeta.title} (${songMeta.difficulty} \u2606${songMeta.difficultyLevel}) ${descSuffix}ノーツ数: ${songMeta.notes} / BPM: ${songMeta.bpm}`
    : `beatmania IIDX 楽曲${label}`;

  const jsonLd = songMeta
    ? {
        "@context": "https://schema.org",
        "@type": schemaType,
        name: pageTitle,
        description,
        url: `${BASE_URL}/songs/${songId}/${tab}`,
        about: {
          "@type": "MusicRecording",
          name: songMeta.title,
          genre: "Electronic",
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "difficulty",
              value: `${songMeta.difficulty} \u2606${songMeta.difficultyLevel}`,
            },
            {
              "@type": "PropertyValue",
              name: "notes",
              value: songMeta.notes,
            },
            {
              "@type": "PropertyValue",
              name: "BPM",
              value: songMeta.bpm,
            },
          ],
          isPartOf: {
            "@type": "VideoGame",
            name: "beatmania IIDX",
          },
        },
      }
    : null;

  return (
    <DashboardLayout>
      <Meta title={pageTitle} description={description} ogType="article" />
      {jsonLd && <JsonLd data={jsonLd} />}
      <PageContainer>
        {!isNaN(songId) ? (
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

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const rawSongId = params?.songId;
  const tab = params?.tab;

  if (
    !tab ||
    Array.isArray(tab) ||
    !(VALID_TABS as readonly string[]).includes(tab)
  ) {
    return {
      redirect: {
        destination: `/songs/${rawSongId}/notes`,
        permanent: false,
      },
    };
  }

  const songId = rawSongId ? parseInt(String(rawSongId), 10) : NaN;
  if (isNaN(songId)) {
    return { notFound: true };
  }

  let songMeta: SongMeta | null = null;
  try {
    const song = await songsRepo.getSongById(songId);
    if (song) {
      songMeta = {
        title: song.title,
        difficulty: song.difficulty,
        difficultyLevel: song.difficultyLevel,
        notes: song.notes,
        bpm: song.bpm,
      };
    }
  } catch {
    // DB 取得失敗時はメタなしで続行
  }

  return { props: { tab: tab as Tab, songId, songMeta } };
};
