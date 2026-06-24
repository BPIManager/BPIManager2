"use client";

import Link from "next/link";
import { User, ChevronRight, Activity } from "lucide-react";
import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useRivalComparison } from "@/hooks/social/useRivalComparison";
import { useProfile } from "@/hooks/users/useProfile";
import { useFollow } from "@/hooks/users/useFollow";
import { useUser } from "@/contexts/users/UserContext";
import { RivalBodySkeleton, RivalHeaderSkeleton } from "./skeleton";
import { RivalHeader, SectionTitle, WinLossStats } from "./ui";
import { RadarSectionChart } from "../../DashBoard/Radar";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fetcher } from "@/utils/common/fetch";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { toast } from "sonner";

export const RivalComparisonModal = ({
  rivalId,
  isOpen,
  onClose,
  viewerRadar,
  version,
}: {
  rivalId: string | null;
  isOpen: boolean;
  onClose: () => void;
  viewerRadar: Record<string, number | { totalBpi: number }>;
  version?: string;
}) => {
  const { fbUser, user } = useUser();

  // ログイン時: compare エンドポイントで profile + 勝敗データを1本で取得
  const {
    data,
    isLoading: isRivalLoading,
    isValidating,
    mutate: mutateCompare,
  } = useRivalComparison(rivalId);

  // ゲスト時のみ: plain profile エンドポイントで表示用データを取得
  const { profile: guestProfile, isLoading: isGuestProfileLoading } = useProfile(
    !fbUser ? (rivalId ?? undefined) : undefined,
  );

  // ログイン時のフォロートグル (compare キャッシュを直接更新)
  const { requestFollow, isUpdating } = useFollow(
    fbUser ? (rivalId ?? undefined) : undefined,
  );
  const { mutate: globalMutate } = useSWRConfig();

  const toggleFollow = useCallback(async () => {
    const currentProfile = data?.profile;
    if (!currentProfile || isUpdating) return;
    const currentStatus = currentProfile.relationship.isFollowing;
    const updatedRelationship = {
      ...currentProfile.relationship,
      isFollowing: !currentStatus,
      isMutual: !currentStatus && currentProfile.relationship.isFollowedBy,
    };
    const optimisticData = {
      ...data,
      profile: {
        ...currentProfile,
        follows: {
          ...currentProfile.follows,
          followers: currentProfile.follows.followers + (currentStatus ? -1 : 1),
        },
        relationship: updatedRelationship,
      },
    };
    try {
      const followPromise = requestFollow(currentStatus);
      await mutateCompare(
        followPromise.then(() => optimisticData),
        { optimisticData, rollbackOnError: true, populateCache: true, revalidate: true },
      );
      // plain profile キャッシュも同期
      const plainKey = [`${API_PREFIX}/users/${rivalId}/profile`, fbUser];
      globalMutate(plainKey, (cur: typeof optimisticData | undefined) => {
        if (!cur) return cur;
        return { ...cur, profile: { ...cur.profile, follows: optimisticData.profile.follows, relationship: updatedRelationship } };
      }, { revalidate: true });
    } catch {
      toast.error("操作が完了しませんでした");
    }
  }, [data, isUpdating, requestFollow, mutateCompare, globalMutate, rivalId, fbUser]);

  // 未ログイン時にライバルのレーダーを公開エンドポイントで取得
  const v = version ?? latestVersion;
  const { data: rivalRadarData, isLoading: isRivalRadarLoading } = useSWR(
    !fbUser && rivalId && isOpen
      ? `${API_PREFIX}/users/${rivalId}/stats/radar?version=${v}`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  if (!rivalId) return null;

  const profile = data?.profile ?? guestProfile;
  const compare = data?.compare;
  const isLoading = fbUser ? isRivalLoading : isGuestProfileLoading;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        placement="bottom-sheet"
        className="gap-0 p-0 shadow-2xl overflow-hidden"
      >
        <DialogHeader className="p-6 pb-2">
          {isLoading ? (
            <RivalHeaderSkeleton />
          ) : (
            <RivalHeader
              profile={profile}
              isUpdating={isUpdating || isValidating}
              onToggleFollow={toggleFollow}
            />
          )}
        </DialogHeader>

        <div className="p-6 pt-0">
          {isLoading ? (
            <RivalBodySkeleton />
          ) : compare ? (
            <div className="flex flex-col gap-6">
              <Separator />

              <WinLossStats
                winLossData={compare.winLoss}
                viewerId={user?.userId}
                rivalId={rivalId ?? undefined}
                myName={user?.userName}
                rivalName={profile?.userName}
              />

              <div className="flex flex-col gap-3">
                <SectionTitle icon={Activity} label="RADAR COMPARISON" />
                <div className="flex h-62.5 w-full items-center justify-center rounded-xl border bg-bpim-surface-2/40 p-4 md:h-75">
                  <RadarSectionChart
                    data={viewerRadar}
                    rivalData={compare.radar}
                    isMini={false}
                  />
                </div>
              </div>

              <Button
                asChild
                className="h-12.5 w-full rounded-xl font-bold active:scale-95"
              >
                <Link href={`/users/${rivalId}`}>
                  <div className="flex items-center justify-center gap-2">
                    <User className="h-4.5 w-4.5" />
                    <span className="text-sm">詳細プロフィールを見る</span>
                    <ChevronRight className="h-4.5 w-4.5" />
                  </div>
                </Link>
              </Button>
            </div>
          ) : !fbUser && rivalRadarData ? (
            <div className="flex flex-col gap-6">
              <Separator />

              <div className="flex flex-col gap-3">
                <SectionTitle icon={Activity} label="RADAR" />
                <div className="flex h-62.5 w-full items-center justify-center rounded-xl border bg-bpim-surface-2/40 p-4 md:h-75">
                  <RadarSectionChart
                    data={{}}
                    rivalData={rivalRadarData}
                    rivalOnly
                    isMini={false}
                  />
                </div>
              </div>

              <Button
                asChild
                className="h-12.5 w-full rounded-xl font-bold active:scale-95"
              >
                <Link href={`/users/${rivalId}`}>
                  <div className="flex items-center justify-center gap-2">
                    <User className="h-4.5 w-4.5" />
                    <span className="text-sm">詳細プロフィールを見る</span>
                    <ChevronRight className="h-4.5 w-4.5" />
                  </div>
                </Link>
              </Button>
            </div>
          ) : !fbUser && isRivalRadarLoading ? (
            <RivalBodySkeleton />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
