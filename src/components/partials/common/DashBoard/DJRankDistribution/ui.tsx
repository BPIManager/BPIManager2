import { useState } from "react";
import { DistributionSection } from "../DistributionChart";
import type {
  DistributionSectionProps,
  RankDisplayMode,
} from "@/types/ui/distribution";

export const RankDistributionSection = (
  props: Omit<DistributionSectionProps, "type" | "mode" | "onModeChange">,
) => {
  const [mode, setMode] = useState<RankDisplayMode>("rank");

  return (
    <DistributionSection
      type={mode}
      mode={mode}
      onModeChange={setMode}
      {...props}
    />
  );
};
