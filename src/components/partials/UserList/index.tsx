"use client";

import { useState } from "react";
import { useRouter } from "next/router";
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

export const UserRecommendationList = () => {
  const { user, isLoading: isCredentialLoading } = useUser();
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const q = (router.query.q as string) || "";
  const p = Number(router.query.p) || 1;
  const s = (router.query.s as string) || "totalBpi";
  const o = (router.query.o as string) || "distance";

  const updateParams = (newParams: {
    q?: string;
    p?: number;
    s?: string;
    o?: string;
  }) => {
    router.push(
      { pathname: router.pathname, query: { ...router.query, ...newParams } },
      undefined,
      { shallow: true },
    );
  };

  const { data, isLoading } = useUserList(q, p, s, o);

  const handleReset = () =>
    updateParams({ q: "", p: 1, s: "totalBpi", o: "distance" });

  const handleCardClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  if (!user && !isCredentialLoading) {
    return <LoginRequiredCard />;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 shadow-sm">
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
