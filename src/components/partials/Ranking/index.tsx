"use client";

import { useEffect, useRef, useCallback } from "react";
import { List, useListRef } from "react-window";
import type { RowComponentProps } from "react-window";
import { useGlobalRanking } from "@/hooks/stats/useGlobalRanking";
import { RankingRow } from "./row";
import { Skeleton } from "@/components/ui/skeleton";
import { RivalComparisonModal } from "../UserList/Modal";
import { useRouter } from "next/router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { versionsNonDisabledCollection } from "@/constants/versions";
import { latestVersion } from "@/constants/latestVersion";
import { Info } from "lucide-react";
import type { RankingEntry } from "@/types/users/ranking";
import { useState } from "react";
import { SongRankingList } from "./SongRankingList";
import { TowerRanking } from "./TowerRanking";
import { LoginRequiredCard } from "../LoginRequired/ui";
import { useUser } from "@/contexts/users/UserContext";
import { PageContainer, PageHeader } from "../Header";
import { GlobalRankingContainerSkeleton } from "./skeleton";

const ITEM_SIZE = 58;

const RADAR_CATEGORIES = [
  { value: "totalBpi", label: "総合BPI" },
  { value: "notes", label: "NOTES" },
  { value: "chord", label: "CHORD" },
  { value: "peak", label: "PEAK" },
  { value: "charge", label: "CHARGE" },
  { value: "scratch", label: "SCRATCH" },
  { value: "soflan", label: "SOFLAN" },
  { value: "songs", label: "個別楽曲" },
  { value: "iidxTower", label: "IIDXタワー" },
] as const;

interface RowData {
  rankings: RankingEntry[];
  onRowClick: (userId: string) => void;
}

const VirtualRow = ({
  index,
  style,
  ariaAttributes,
  rankings,
  onRowClick,
}: RowComponentProps<RowData>) => {
  const entry = rankings[index];
  return (
    <div
      style={{
        ...style,
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 3,
        paddingBottom: 3,
      }}
      {...ariaAttributes}
    >
      <RankingRow entry={entry} onClick={() => onRowClick(entry.userId)} />
    </div>
  );
};

export const GlobalRankingContainer = () => {
  const router = useRouter();
  const { user, isLoading: isCredentialLoading } = useUser();
  const version = (router.query.version as string) || latestVersion;
  const category = (router.query.category as string) || "totalBpi";
  const isSongsCategory = category === "songs";
  const isTowerCategory = category === "iidxTower";
  const isRadarCategory =
    category !== "totalBpi" && !isSongsCategory && !isTowerCategory;
  const isLatestVersion = version === latestVersion;

  const { data, isLoading } = useGlobalRanking(
    version,
    isSongsCategory || isTowerCategory ? "totalBpi" : category,
  );
  const listRef = useListRef(null);
  const hasScrolled = useRef(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    hasScrolled.current = false;
  }, [version, category]);

  useEffect(() => {
    if (data && !hasScrolled.current) {
      const selfIndex = data.rankings.findIndex((e) => e.isSelf);
      if (selfIndex >= 0) {
        hasScrolled.current = true;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            listRef.current?.scrollToRow({ index: selfIndex, align: "center" });
          });
        });
      }
    }
  }, [data, listRef]);

  const handleVersionChange = (v: string) => {
    const newVersion = v;
    const isNewVersionLatest = newVersion === latestVersion;
    const keepCategory =
      category === "songs" || isNewVersionLatest || category === "totalBpi";
    router.push(
      {
        query: {
          ...router.query,
          version: newVersion,
          category: keepCategory ? category : "totalBpi",
        },
      },
      undefined,
      { shallow: true },
    );
  };

  const handleCategoryChange = (c: string) => {
    router.push({ query: { ...router.query, category: c } }, undefined, {
      shallow: true,
    });
  };

  const handleRowClick = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  }, []);

  if (!isSongsCategory && !isTowerCategory && isLoading) {
    return (
      <>
        <PageHeader
          title="全体ランキング"
          description="総合BPI・個別楽曲・IIDXタワーなどのランキング(BPIM2内実順位ベース)"
        />
        <PageContainer>
          <GlobalRankingContainerSkeleton />
        </PageContainer>
      </>
    );
  }

  const totalCount = data?.totalCount ?? 0;
  const selfRank = data?.selfRank ?? 0;
  const viewerRadar = data?.viewerRadar ?? {};

  const rowProps: RowData = {
    rankings: data?.rankings ?? [],
    onRowClick: handleRowClick,
  };

  if (!user && !isCredentialLoading) {
    return <LoginRequiredCard />;
  }

  if (!isSongsCategory && !isTowerCategory && !data) return null;

  return (
    <>
      <PageHeader
        title="全体ランキング"
        description="総合BPI・個別楽曲・IIDXタワーなどのランキング(BPIM2内実順位ベース)"
      />
      <PageContainer>
        <div className="flex gap-3 mb-4">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
              Version
            </label>
            <Select value={version} onValueChange={handleVersionChange}>
              <SelectTrigger className="w-full h-9 border-bpim-border bg-bpim-bg text-bpim-text focus:ring-blue-500">
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

          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
              Category
            </label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full h-9 border-bpim-border bg-bpim-bg text-bpim-text focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
                {RADAR_CATEGORIES.filter(
                  (c) =>
                    isLatestVersion ||
                    c.value === "totalBpi" ||
                    c.value === "songs",
                ).map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isTowerCategory ? (
          <TowerRanking version={version} />
        ) : isSongsCategory ? (
          <SongRankingList version={version} />
        ) : (
          <>
            {isRadarCategory && isLatestVersion && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  レーダーランキングは事前計算された値を使用しているため、スコア反映まで最大24時間の遅延が発生します。
                </span>
              </div>
            )}

            {selfRank > 0 && (
              <div className="rounded-xl border border-bpim-muted/20 bg-bpim-overlay/40 p-4 shadow-sm mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-md text-bpim-muted">
                      全 {totalCount} 人中
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-bpim-muted">現在の順位</span>
                    <div className="font-mono text-xl font-bold text-bpim-text">
                      <span className="text-bpim-primary">{selfRank}</span>
                      <span className="ml-0.5 text-sm">位</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <List
              listRef={listRef}
              rowComponent={VirtualRow}
              rowCount={rowProps.rankings.length}
              rowHeight={ITEM_SIZE}
              rowProps={rowProps}
              defaultHeight={500}
              overscanCount={5}
              className="rounded-xl border border-bpim-border"
              style={{ height: "calc(100svh - 380px)", minHeight: "350px" }}
            />

            {selectedUserId && (
              <RivalComparisonModal
                rivalId={selectedUserId}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                viewerRadar={viewerRadar}
              />
            )}
          </>
        )}
      </PageContainer>
    </>
  );
};
