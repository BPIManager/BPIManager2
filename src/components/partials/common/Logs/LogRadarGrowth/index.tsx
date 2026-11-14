import { useState } from "react";
import { useBatchRadarGrowth } from "@/hooks/batches/useBatchRadarGrowth";
import RadarSkeleton from "@/components/partials/common/DashBoard/Radar/skeleton";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import { DashCard } from "@/components/ui/dashcard";
import type { RadarCategory } from "@/types/stats/radar";
import LogRadarGrowthCard from "./ui";
import RadarGrowthSongsDialog from "./SongsDialog";

interface LogRadarGrowthProps {
  userId?: string;
  version?: string;
  /** バッチ ID（type=batch）または日付 */
  periodKey?: string;
  type: "batch" | "day" | "week" | "month";
  groupedBy: string;
}

const LogRadarGrowth = ({
  userId,
  version,
  periodKey,
  type,
  groupedBy,
}: LogRadarGrowthProps) => {
  const [selectedCategory, setSelectedCategory] = useState<RadarCategory | null>(null);
  const { data, isLoading, isError } = useBatchRadarGrowth(
    userId,
    version,
    periodKey,
    type,
    groupedBy,
  );

  if (isLoading) return <RadarSkeleton />;
  if (isError) {
    return (
      <DashCard>
        <FetchErrorState error={isError} />
      </DashCard>
    );
  }
  if (!data) return null;

  return (
    <>
      <LogRadarGrowthCard data={data} onSelectCategory={setSelectedCategory} />
      <RadarGrowthSongsDialog
        category={selectedCategory}
        userId={userId}
        version={version}
        periodKey={periodKey}
        type={type}
        groupedBy={groupedBy}
        onClose={() => setSelectedCategory(null)}
      />
    </>
  );
};

export default LogRadarGrowth;
