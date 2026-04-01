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

export const RivalListContainer = ({
  viewerRadar,
}: {
  viewerRadar?: Record<string, number | { totalBpi: number }>;
}) => {
  const { user, isLoading: isCredentialLoading } = useUser();
  const router = useRouter();
  const { levels, difficulties, handleToggleLevel, handleToggleDifficulty } =
    useRivalListFilter();

  const { rivals, isLoading, isError } = useRivalSummary({
    userId: user?.userId || false,
    levels,
    difficulties,
    version: latestVersion,
  });

  if (!user && !isCredentialLoading) return <LoginRequiredCard />;

  return (
    <div className="flex w-full flex-col gap-8">
      <RivalFilter
        levels={levels}
        difficulties={difficulties}
        onToggleLevel={handleToggleLevel}
        onToggleDifficulty={handleToggleDifficulty}
      />
      <RivalList
        results={rivals}
        isLoading={isLoading}
        isError={isError}
        onCardClick={(id: string) => router.push(`/rivals/${id}`)}
      />
    </div>
  );
};
