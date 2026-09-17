import { cn } from "@/lib/utils";
import { getBpiColorStyle } from "@/constants/theme/bpiColor";

const BpiChip = ({
  bpi,
  size = "sm",
}: {
  bpi: number;
  size?: "xs" | "sm";
}) => {
  const { bg, color } = getBpiColorStyle(bpi);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded font-mono font-bold",
        size === "xs" ? "px-1 py-0 text-xs" : "px-1.5 py-0.5 text-xs",
      )}
      style={{ backgroundColor: bg, color }}
    >
      {bpi <= -15 ? "未" : bpi.toFixed(1)}
    </span>
  );
};

export default BpiChip;
