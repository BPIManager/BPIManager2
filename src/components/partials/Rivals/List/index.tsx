"use client";

import { useMemo } from "react";
import { latestVersion } from "@/constants/latestVersion";
import { useUser } from "@/contexts/users/UserContext";
import { useRivalSummary } from "@/hooks/social/useRivalSummary";
import { RivalFilter } from "./filter";
import { RivalList } from "./container";
import { LoginRequiredCard } from "../../LoginRequired/ui";
import { useRivalListFilter } from "@/hooks/social/useRivalListFilter";
import { useRouter } from "next/router";
import { PageContainer, PageHeader } from "../../Header";

export const RivalListContainer = ({
  viewerRadar,
}: {
  viewerRadar?: Record<string, number | { totalBpi: number }>;
}) => {
  const { user, isLoading: isCredentialLoading } = useUser();
  const router = useRouter();
  const {
    levels,
    difficulties,
    sortOrder,
    handleToggleLevel,
    handleToggleDifficulty,
    setSortOrder,
  } = useRivalListFilter();

  const { rivals, isLoading, isError } = useRivalSummary({
    userId: user?.userId || false,
    levels,
    difficulties,
    version: latestVersion,
  });

  const sortedRivals = useMemo(() => {
    if (!rivals.length) return rivals;
    return [...rivals].sort((a, b) => {
      if (sortOrder === "win_desc") {
        return (b.stats.win - b.stats.lose) - (a.stats.win - a.stats.lose);
      }
      if (sortOrder === "lose_desc") {
        return (b.stats.lose - b.stats.win) - (a.stats.lose - a.stats.win);
      }
      // updated_desc
      const ta = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      const tb = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      return tb - ta;
    });
  }, [rivals, sortOrder]);

  if (!user && !isCredentialLoading) return <LoginRequiredCard />;

  return (
    <>
      <PageHeader title="ライバル" description="ライバル一覧・全体ランキング" />
      <PageContainer>
        <div className="flex w-full flex-col gap-8">
          <RivalFilter
            levels={levels}
            difficulties={difficulties}
            sortOrder={sortOrder}
            onToggleLevel={handleToggleLevel}
            onToggleDifficulty={handleToggleDifficulty}
            onChangeSortOrder={setSortOrder}
          />
          <RivalList
            results={sortedRivals}
            isLoading={isLoading}
            isError={isError}
            onCardClick={(id: string) => router.push(`/rivals/${id}`)}
          />
        </div>
      </PageContainer>
    </>
  );
};
