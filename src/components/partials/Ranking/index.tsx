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
import { versionsNonDisabledCollection } from "@/constants/iidx/versions";
import { latestVersion } from "@/constants/iidx/latestVersion";
import { JAPAN_PREFECTURES } from "@/constants/iidx/japanPrefectures";
import { ARENA_RANK_ORDER } from "@/constants/iidx/arenaRanks";
import { Info } from "lucide-react";
import type { RankingEntry } from "@/types/users/ranking";
import { useState } from "react";
import { SongRankingList } from "./SongRankingList";
import { TowerRanking } from "./TowerRanking";
import { LoginRequiredCard } from "../LoginRequired/ui";
import { useUser } from "@/contexts/users/UserContext";
import { PageContainer, PageHeader } from "../Header";
import { GlobalRankingContainerSkeleton } from "./skeleton";
import { useTranslation } from "@/hooks/common/useTranslation";

const ITEM_SIZE = 58;

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
  const { t } = useTranslation();

  const radarCategories = [
    { value: "totalBpi", label: t("ranking.category.totalBpi") },
    { value: "notes", label: t("ranking.category.notes") },
    { value: "chord", label: t("ranking.category.chord") },
    { value: "peak", label: t("ranking.category.peak") },
    { value: "charge", label: t("ranking.category.charge") },
    { value: "scratch", label: t("ranking.category.scratch") },
    { value: "soflan", label: t("ranking.category.soflan") },
    { value: "songs", label: t("ranking.category.songs") },
    { value: "iidxTower", label: t("ranking.category.iidxTower") },
  ];
  const version = (router.query.version as string) || latestVersion;
  const category = (router.query.category as string) || "totalBpi";
  const isSongsCategory = category === "songs";
  const isTowerCategory = category === "iidxTower";
  const isRadarCategory =
    category !== "totalBpi" && !isSongsCategory && !isTowerCategory;
  const isLatestVersion = version === latestVersion;
  const isTotalBpiCategory = category === "totalBpi";

  const filterArea = isTotalBpiCategory
    ? (router.query.area as string) || ""
    : "";
  const filterArenaClass = isTotalBpiCategory
    ? (router.query.arenaClass as string) || ""
    : "";

  const { data, isLoading } = useGlobalRanking(
    version,
    isSongsCategory || isTowerCategory ? "totalBpi" : category,
    filterArea || undefined,
    filterArenaClass || undefined,
  );
  const listRef = useListRef(null);
  const hasScrolled = useRef(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    hasScrolled.current = false;
  }, [version, category, filterArea, filterArenaClass]);

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
    const newQuery: Record<string, string> = {
      ...(router.query as Record<string, string>),
      category: c,
    };
    if (c !== "totalBpi") {
      delete newQuery.area;
      delete newQuery.arenaClass;
    }
    router.push({ query: newQuery }, undefined, { shallow: true });
  };

  const handleAreaChange = (v: string) => {
    router.push(
      {
        query: {
          ...router.query,
          area: v === "all" ? undefined : v,
        },
      },
      undefined,
      { shallow: true },
    );
  };

  const handleArenaClassChange = (v: string) => {
    router.push(
      {
        query: {
          ...router.query,
          arenaClass: v === "all" ? undefined : v,
        },
      },
      undefined,
      { shallow: true },
    );
  };

  const handleRowClick = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  }, []);

  if (!isSongsCategory && !isTowerCategory && isLoading) {
    return (
      <>
        <PageHeader
          title={t("page.ranking.title")}
          description={t("page.ranking.desc")}
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
        title={t("page.ranking.title")}
        description={t("page.ranking.desc")}
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
                {radarCategories.filter(
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

        {isTotalBpiCategory && (
          <div className="flex gap-3 mb-4">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
                {t("ranking.filter.area")}
              </label>
              <Select
                value={filterArea || "all"}
                onValueChange={handleAreaChange}
              >
                <SelectTrigger className="w-full h-9 border-bpim-border bg-bpim-bg text-bpim-text focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
                  <SelectItem value="all">{t("ranking.filter.all")}</SelectItem>
                  {JAPAN_PREFECTURES.map((pref) => (
                    <SelectItem key={pref} value={pref}>
                      {pref}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
                {t("ranking.filter.arenaClass")}
              </label>
              <Select
                value={filterArenaClass || "all"}
                onValueChange={handleArenaClassChange}
              >
                <SelectTrigger className="w-full h-9 border-bpim-border bg-bpim-bg text-bpim-text focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
                  <SelectItem value="all">{t("ranking.filter.all")}</SelectItem>
                  {ARENA_RANK_ORDER.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {isTowerCategory ? (
          <TowerRanking version={version} />
        ) : isSongsCategory ? (
          <SongRankingList version={version} />
        ) : (
          <>
            {isRadarCategory && isLatestVersion && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{t("ranking.radar.delayNotice")}</span>
              </div>
            )}

            {selfRank > 0 && (
              <div className="rounded-xl border border-bpim-muted/20 bg-bpim-overlay/40 p-4 shadow-sm mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-md text-bpim-muted">
                      {t("ranking.selfRank.outOf")}{totalCount}{t("ranking.selfRank.people")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-bpim-muted">{t("ranking.selfRank.label")}</span>
                    <div className="font-mono text-xl font-bold text-bpim-text">
                      <span className="text-bpim-primary">{selfRank}</span>
                      <span className="ml-0.5 text-sm">{t("ranking.selfRank.suffix")}</span>
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
              style={{ height: `calc(100svh - ${isTotalBpiCategory ? 440 : 380}px)`, minHeight: "350px" }}
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
