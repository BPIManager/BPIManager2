import { cn } from "@/lib/utils";
import { DIFF_COLORS } from "@/constants/theme/difficultyColors";

const DifficultyBadge = ({
  difficulty,
  size = "sm",
  className,
}: {
  difficulty: string;
  size?: "xs" | "sm";
  className?: string;
}) => (
  <span
    className={cn(
      "shrink-0 rounded font-black text-white",
      size === "xs" ? "px-1 py-0.5 text-[10px]" : "px-1.5 py-0.5 text-xs",
      DIFF_COLORS[difficulty],
      className,
    )}
  >
    {difficulty.charAt(0)}
  </span>
);

export default DifficultyBadge;
