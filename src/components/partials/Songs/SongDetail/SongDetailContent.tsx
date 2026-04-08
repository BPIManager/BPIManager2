import { useRouter } from "next/router";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RankingTab } from "./RankingTab";
import { SimilarTab } from "./SimilarTab";
import { SongMetaCard } from "./SongMetaCard";
import { useSongDetail } from "@/hooks/songs/useSongDetail";
import { latestVersion } from "@/constants/latestVersion";
import { ChevronLeft, Music, FileText, BarChart3, Layers } from "lucide-react";
import { SongDetailSkeleton } from "./SongDetailSkeleton";
import { WikiTab } from "./WikiTab";

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
            <TabsList className="w-full bg-bpim-surface border border-bpim-border">
              <TabsTrigger
                value="notes"
                className="flex-1 data-[state=active]:bg-bpim-overlay"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                攻略メモ
              </TabsTrigger>
              <TabsTrigger
                value="similar"
                className="flex-1 data-[state=active]:bg-bpim-overlay"
              >
                <Layers className="h-3.5 w-3.5 mr-1.5" />
                類似楽曲
              </TabsTrigger>
              <TabsTrigger
                value="ranking"
                className="flex-1 data-[state=active]:bg-bpim-overlay"
              >
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                ランキング
              </TabsTrigger>
              <TabsTrigger
                value="pattern"
                className="flex-1 data-[state=active]:bg-bpim-overlay"
              >
                <Music className="h-3.5 w-3.5 mr-1.5" />
                当たり譜面
              </TabsTrigger>
            </TabsList>

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
              <div className="mt-4 flex flex-col items-center gap-3 py-16 rounded-xl border border-dashed border-bpim-border text-bpim-muted">
                <Music className="h-8 w-8 opacity-30" />
                <p className="text-sm font-bold">当たり譜面分析</p>
                <p className="text-xs opacity-60">準備中</p>
              </div>
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
