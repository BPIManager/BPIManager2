import { DashCard } from "@/components/ui/dashcard";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useBpmBpiDistribution } from "@/hooks/stats/useBpmBpiDistribution";
import { BpmBpiSkeleton } from "./skeleton";
import { BpmBpiChart } from "./ui";
import { getVersionNameFromNumber } from "@/constants/versions";

interface BpmBpiDistributionSectionProps {
  myUserId?: string;
  rivalUserId?: string;
  myName?: string;
  rivalName?: string;
}

export const BpmBpiDistributionSection = ({
  myUserId,
  rivalUserId,
  myName = "自分",
  rivalName = "ライバル",
}: BpmBpiDistributionSectionProps) => {
  const { levels, diffs, version, compareVersion } = useStatsFilter();

  const isCompareMode = !rivalUserId && !!compareVersion;
  const effectiveRivalUserId = rivalUserId ?? (isCompareMode ? myUserId : undefined);
  const effectiveRivalVersion = rivalUserId ? version : compareVersion;
  const effectiveRivalName = rivalUserId
    ? rivalName
    : getVersionNameFromNumber(compareVersion);

  const { distribution: myDist, isLoading: myLoading } = useBpmBpiDistribution(
    myUserId,
    levels,
    diffs,
    version,
  );
  const { distribution: rivalDist, isLoading: rivalLoading } =
    useBpmBpiDistribution(effectiveRivalUserId, levels, diffs, effectiveRivalVersion);

  const isLoading = myLoading || (!!effectiveRivalUserId && rivalLoading);

  if (isLoading) return <BpmBpiSkeleton />;
  if (!myDist || myDist.length === 0) return null;

  return (
    <DashCard>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase text-bpim-muted">BPM帯別</h3>
        {effectiveRivalUserId && (
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-bpim-primary" />
              <span className="text-xs text-bpim-primary">{myName}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-bpim-warning opacity-60" />
              <span className="text-xs text-bpim-warning">{effectiveRivalName}</span>
            </div>
          </div>
        )}
      </div>
      <BpmBpiChart
        myData={myDist}
        rivalData={effectiveRivalUserId ? rivalDist : undefined}
      />
    </DashCard>
  );
};
