import {
  DistributionSection,
  DistributionSectionProps,
} from "../DistributionChart";

export const RankDistributionSection = (
  props: Omit<DistributionSectionProps, "type">,
) => <DistributionSection type="rank" {...props} />;
