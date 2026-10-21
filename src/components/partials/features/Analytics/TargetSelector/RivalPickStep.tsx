"use client";

import { useState } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { useRivalSummary } from "@/hooks/social/useRivalSummary";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { RivalPickList } from "./ui";

export default function RivalPickStep({
  onSelect,
}: {
  onSelect: (userId: string, name: string) => void;
}) {
  const { user } = useUser();
  const [search, setSearch] = useState("");

  const { rivals, isLoading } = useRivalSummary({
    userId: user?.userId || false,
    levels: ["11", "12"],
    difficulties: IIDX_DIFFICULTIES,
    version: latestVersion,
  });

  const filtered = rivals.filter((r) =>
    r.userName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <RivalPickList
      rivals={filtered}
      isLoading={isLoading}
      search={search}
      onSearchChange={setSearch}
      onSelect={onSelect}
    />
  );
}
