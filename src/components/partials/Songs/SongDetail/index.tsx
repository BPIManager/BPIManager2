import { useRouter } from "next/router";
import Link from "next/link";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AppTabsList, AppTabsTrigger } from "@/components/ui/complex/tabs";
import { ChevronLeft, Music, FileText, BarChart3, Layers } from "lucide-react";
import { useSongDetail } from "@/hooks/songs/useSongDetail";
import { latestVersion } from "@/constants/latestVersion";
import { RankingTab } from "./Ranking";
import { SimilarTab } from "./Similar";
import { WikiTab } from "./Wiki";
import { PatternTab } from "./Pattern";
import { SongMetaCard } from "./ui";
import { SongDetailSkeleton } from "./skeleton";

interface SongDetailContentProps {
  songId: number;
  activeTab: string;
}

export function SongDetailContent({
  songId,
  activeTab,
}: SongDetailContentProps) {
  const router = useRouter();
  const version = (router.query.version as string) || latestVersion;

  const { song, isLoading } = useSongDetail(songId);

  function handleTabChange(tab: string) {
    router.push(`/songs/${songId}/${tab}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center">
        <Link
          href="/songs"
          className="flex items-center gap-1 text-xs text-bpim-muted hover:text-bpim-text transition-colors"
        >
          <ChevronLeft className="h-3 w-3" />
          楽曲一覧
        </Link>
      </div>

      {isLoading ? (
        <SongDetailSkeleton />
      ) : song ? (
        <>
          <SongMetaCard song={song} />

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <AppTabsList visual="card" cols={4}>
              {[
                { value: "notes", label: "攻略メモ", icon: FileText },
                { value: "similar", label: "類似楽曲", icon: Layers },
                { value: "ranking", label: "ランキング", icon: BarChart3 },
                { value: "pattern", label: "当たり譜面", icon: Music },
              ].map((t) => (
                <AppTabsTrigger
                  key={t.value}
                  value={t.value}
                  visual="card"
                  icon={t.icon}
                  iconOnly
                >
                  {t.label}
                </AppTabsTrigger>
              ))}
            </AppTabsList>

            <TabsContent value="ranking">
              <RankingTab songId={songId} />
            </TabsContent>

            <TabsContent value="similar">
              <SimilarTab songId={songId} version={version} />
            </TabsContent>

            <TabsContent value="notes">
              <WikiTab songId={songId} />
            </TabsContent>

            <TabsContent value="pattern">
              <PatternTab songId={songId} song={song} />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-bpim-muted">
          <Music className="h-10 w-10 opacity-30" />
          <p className="text-sm">楽曲が見つかりませんでした</p>
        </div>
      )}
    </div>
  );
}
