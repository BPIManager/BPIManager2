import { socialComparisonRepo } from "@/lib/db/aggregates/rivalScores/comparison";
import { userProfileRepo } from "@/lib/db/aggregates/userProfiles/profile";
import type { AreaRankInfo } from "@/lib/arena/prefectureRankings";
import type { HandlerResult } from "@/types/api";

export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

export type ProfileSummary = NonNullable<
  Awaited<ReturnType<typeof userProfileRepo.getUserProfileSummary>>
>;
type ProfileSummaryWithoutPrivacy = Omit<ProfileSummary, "statsPrivacy">;
export type ProfileWithAreaRank = ProfileSummaryWithoutPrivacy & {
  areaRank: AreaRankInfo | null;
};

export interface ProfileResponse {
  profile: ProfileWithAreaRank | null;
  compare?: {
    winLoss: Awaited<
      ReturnType<typeof socialComparisonRepo.getWinLossStats>
    > | null;
    radar: Record<string, number> | null;
  };
  statsPrivacy?: ProfileSummary["statsPrivacy"];
}
