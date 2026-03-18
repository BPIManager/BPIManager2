"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { latestVersion } from "@/constants/latestVersion";
import { useUser } from "@/contexts/users/UserContext";
import { useRivalSummary } from "@/hooks/social/useRivalSummary";
import { RivalFilter } from "./filter";
import { RivalList } from "./container";
import { LoginRequiredCard } from "../../LoginRequired/ui";

export const RivalListContainer = () => {
  const { user, isLoading: isCredentialLoading } = useUser();
  const router = useRouter();
  const [levels, setLevels] = useState<string[]>(["11", "12"]);
  const [difficulties, setDifficulties] = useState<string[]>([
    "HYPER",
    "ANOTHER",
    "LEGGENDARIA",
  ]);

  const { results, isLoading, isError } = useRivalSummary({
    userId: user?.userId || false,
    levels,
    difficulties,
    version: latestVersion,
  });

  const handleToggleLevel = (lv: string) => {
    setLevels((prev) =>
      prev.includes(lv) ? prev.filter((l) => l !== lv) : [...prev, lv],
    );
  };

  const handleToggleDifficulty = (diff: string) => {
    setDifficulties((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff],
    );
  };

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
        results={results || []}
        isLoading={isLoading}
        isError={isError}
        onCardClick={(id: string) => router.push(`/rivals/${id}`)}
      />
    </div>
  );
};
