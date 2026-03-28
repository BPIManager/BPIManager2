import { DistributionSection } from "../DistributionChart";
import type { DistributionSectionProps } from "@/types/ui/distribution";

export const RankDistributionSection = (
  props: Omit<DistributionSectionProps, "type">,
) => <DistributionSection type="rank" {...props} />;
