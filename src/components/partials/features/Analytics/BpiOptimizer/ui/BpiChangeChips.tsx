import { ArrowRight } from "lucide-react";
import BpiChip from "./BpiChip";

const BpiChangeChips = ({
  fromBpi,
  toBpi,
  size = "xs",
}: {
  fromBpi: number;
  toBpi: number;
  size?: "xs" | "sm";
}) => (
  <div className="flex items-center gap-2">
    <BpiChip bpi={fromBpi} size={size} />
    <ArrowRight className="h-3 w-3 text-bpim-primary/50" />
    <BpiChip bpi={toBpi} size={size} />
  </div>
);

export default BpiChangeChips;
