import {
  DistributionSection,
  DistributionSectionProps,
} from "../DistributionChart";

export const BpiDistributionSection = (
  props: Omit<DistributionSectionProps, "type">,
) => <DistributionSection type="bpi" {...props} />;
