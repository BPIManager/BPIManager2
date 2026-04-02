import { cn } from "@/lib/utils";
import { getBpiColorStyle } from "@/constants/bpiColor";

export const BpiChip = ({
  bpi,
  size = "sm",
}: {
  bpi: number;
  size?: "xs" | "sm";
}) => {
  const { bg } = getBpiColorStyle(bpi);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded font-mono font-bold text-white",
        size === "xs" ? "px-1 py-0 text-[10px]" : "px-1.5 py-0.5 text-xs",
      )}
      style={{ backgroundColor: bg }}
    >
      {bpi <= -15 ? "未" : bpi.toFixed(1)}
    </span>
  );
};
