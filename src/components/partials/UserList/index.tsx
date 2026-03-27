"use client";

import { useState } from "react";
import { UserRecommendationCard } from "./Card/ui";
import { SortSelector } from "./Filter/sortInput";
import { SearchInput } from "./Filter/searchInput";
import { Pagination } from "./pagination";
import { UserRecommendationCardSkeleton } from "./Card/skeleton";
import { UserRecommendationEmpty } from "./Card/empty";
import { RivalComparisonModal } from "./Modal";
import { LoginRequiredCard } from "../LoginRequired/ui";
import { useUser } from "@/contexts/users/UserContext";
import { useUserList } from "@/hooks/users/useUserList";
import { useUserListParams } from "@/hooks/users/useUserListParams";

export const UserRecommendationList = () => {
  const { user, isLoading: isCredentialLoading } = useUser();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { q, p, s, o, updateParams, handleReset } = useUserListParams();
  const { data, isLoading } = useUserList(q, p, s, o);

  const handleCardClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  if (!user && !isCredentialLoading) {
    return <LoginRequiredCard />;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="rounded-xl border border-bpim-border bg-bpim-bg/40 p-4 shadow-sm">
        <SortSelector
          sort={s}
          order={o}
          onChange={(val) => {
            const [sort, order] = val.split("_");
            updateParams({ s: sort, o: order, p: 1 });
          }}
        />
        <div className="flex gap-4">
          <SearchInput
            initialValue={q}
            onSearch={(val) => updateParams({ q: val, p: 1 })}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <UserRecommendationCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.users.length === 0 ? (
        <UserRecommendationEmpty onReset={handleReset} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data?.users.map((u) => (
            <UserRecommendationCard
              key={u.userId}
              user={u}
              viewerRadar={data.viewer.radar}
              viewerTotalBpi={data.viewer.totalBpi}
              currentSort={s}
              onClick={() => handleCardClick(u.userId)}
            />
          ))}
        </div>
      )}

      {selectedUserId && (
        <RivalComparisonModal
          rivalId={selectedUserId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          viewerRadar={data?.viewer.radar}
        />
      )}

      {!isLoading && data && (
        <div className="mt-4 flex justify-center">
          <Pagination
            p={p}
            hasMore={data.users.length === 20}
            onPageChange={(next) => updateParams({ p: next })}
          />
        </div>
      )}
    </div>
  );
};
