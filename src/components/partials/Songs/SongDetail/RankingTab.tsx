import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { latestVersion } from "@/constants/latestVersion";
import { versionsNonDisabledCollection } from "@/constants/versions";
import { useUser } from "@/contexts/users/UserContext";
import { useRadar } from "@/hooks/stats/useRadar";
import { useSongRanking } from "@/hooks/songs/useSongRanking";
import {
  RANKING_ROW_HEIGHT,
  SongRankingListRow,
  SongRankingTableHeader,
} from "@/components/partials/Songs/SongRankingListRow";
import { List, type ListImperativeAPI } from "react-window";
import { RivalComparisonModal } from "@/components/partials/UserList/Modal";

interface RankingTabProps {
  songId: number;
}

export function RankingTab({ songId }: RankingTabProps) {
  const router = useRouter();
  const version = (router.query.version as string) || latestVersion;

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const listRef = useRef<ListImperativeAPI>(null);

  const { fbUser } = useUser();

  const { radar: viewerRadar } = useRadar(fbUser?.uid, [], [], version);

  const handleVersionChange = (v: string) => {
    router.push({ query: { ...router.query, version: v } }, undefined, {
      shallow: true,
    });
  };

  const handleRowClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  const { data, isLoading } = useSongRanking(songId, version);

  const selfEntry = data?.rankings.find((r) => r.isSelf);
  const selfExScore = selfEntry?.exScore;
  const showDiff = selfExScore !== undefined;

  useEffect(() => {
    if (!data || !listRef.current) return;
    const selfIndex = data.rankings.findIndex((r) => r.isSelf);
    if (selfIndex < 0) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToRow({ align: "center", index: selfIndex });
    }, 50);
    return () => clearTimeout(timer);
  }, [data]);

  return (
    <div className="flex flex-col gap-3 mt-2">
      <div className="flex items-center justify-end gap-2">
        <span className="text-[10px] font-bold text-bpim-muted uppercase tracking-widest">
          Version
        </span>
        <Select value={version} onValueChange={handleVersionChange}>
          <SelectTrigger className="h-7 w-36 border-bpim-border bg-bpim-bg text-bpim-text text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
            {versionsNonDisabledCollection.map((v) => (
              <SelectItem key={v.value} value={v.value}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : !data ? null : (
        <>
          {data.selfRank > 0 && (
            <div className="rounded-xl border border-bpim-muted/20 bg-bpim-overlay/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-bpim-muted">
                  全 {data.totalCount} 人中
                </p>
                <div className="text-right">
                  <span className="text-xs text-bpim-muted">あなたの順位</span>
                  <div className="font-mono text-lg font-bold text-bpim-text">
                    <span className="text-bpim-primary">{data.selfRank}</span>
                    <span className="ml-0.5 text-xs">位</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {data.rankings.length === 0 ? (
            <p className="py-8 text-center text-sm text-bpim-muted">
              まだランキングデータがありません
            </p>
          ) : (
            <div className="w-full overflow-hidden rounded-md border border-bpim-border">
              <SongRankingTableHeader showDiff={showDiff} />
              <List
                listRef={listRef}
                rowCount={data.rankings.length}
                rowHeight={RANKING_ROW_HEIGHT}
                rowComponent={SongRankingListRow}
                rowProps={{
                  rankings: data.rankings,
                  selfExScore,
                  onNavigate: handleRowClick,
                }}
                style={{ height: "40svh" }}
                className="overscroll-contain custom-scrollbar"
              />
            </div>
          )}
        </>
      )}

      <RivalComparisonModal
        rivalId={selectedUserId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        viewerRadar={viewerRadar ?? {}}
        version={version}
      />
    </div>
  );
}
