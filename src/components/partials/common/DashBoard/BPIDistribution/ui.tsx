import DistributionSection from "../DistributionChart";
import type { DistributionSectionProps } from "@/types/ui/distribution";

const BpiDistributionSection = (
  props: Omit<DistributionSectionProps, "type">,
) => <DistributionSection type="bpi" {...props} />;

export default BpiDistributionSection;
