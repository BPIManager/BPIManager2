"use client";

import Link from "next/link";
import { User, ChevronRight, Activity } from "lucide-react";
import { useRivalComparison } from "@/hooks/social/useRivalComparison";
import { useProfile } from "@/hooks/users/useProfile";
import { RivalBodySkeleton, RivalHeaderSkeleton } from "./skeleton";
import { RivalHeader, SectionTitle, WinLossStats } from "./ui";
import { RadarSectionChart } from "../../DashBoard/Radar/ui";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const RivalComparisonModal = ({
  rivalId,
  isOpen,
  onClose,
  viewerRadar,
}: any) => {
  const {
    data,
    isLoading: isRivalLoading,
    isValidating,
  } = useRivalComparison(rivalId);

  const {
    toggleFollow,
    isUpdating,
    profile: profileData,
    isLoading: isProfileLoading,
  } = useProfile(rivalId);

  if (!rivalId) return null;

  const profile = data?.profile || profileData;
  const compare = data?.compare;
  const isLoading = isRivalLoading || isProfileLoading;

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
          ) : (
            compare && (
              <div className="flex flex-col gap-6">
                <Separator />

                <WinLossStats winLossData={compare.winLoss} />

                <div className="flex flex-col gap-3">
                  <SectionTitle icon={Activity} label="RADAR COMPARISON" />
                  <div className="flex h-[250px] w-full items-center justify-center rounded-xl border bg-bpim-surface-2/40 p-4 md:h-[300px]">
                    <RadarSectionChart
                      data={viewerRadar}
                      rivalData={compare.radar}
                      isMini={false}
                    />
                  </div>
                </div>

                <Button
                  asChild
                  className="h-[50px] w-full rounded-xl font-bold active:scale-95"
                >
                  <Link href={`/users/${rivalId}`}>
                    <div className="flex items-center justify-center gap-2">
                      <User className="h-[18px] w-[18px]" />
                      <span className="text-sm">詳細プロフィールを見る</span>
                      <ChevronRight className="h-[18px] w-[18px]" />
                    </div>
                  </Link>
                </Button>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
