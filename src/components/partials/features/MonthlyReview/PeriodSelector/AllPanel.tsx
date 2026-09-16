import { useTranslation } from "@/hooks/common/useTranslation";
import { btnBase } from "./_shared";

export const AllPanel = ({
  version,
  currentVersion,
  isCurrentAllMode,
  onAllClick,
}: {
  version: string;
  currentVersion: string;
  isCurrentAllMode: boolean;
  onAllClick: () => void;
}) => {
  const { tFormat } = useTranslation();
  const isSelected = isCurrentAllMode && version === currentVersion;
  return (
    <div>
      <button
        onClick={onAllClick}
        className="w-full rounded-md py-2 text-xs font-bold transition-all"
        style={
          isSelected
            ? {
                background: "rgba(52,211,153,0.2)",
                border: "1px solid rgba(52,211,153,0.4)",
                color: "#34d399",
              }
            : btnBase
        }
      >
        {tFormat("monthlyReview.period.selectAll", {
          version: version === "INF" ? "INF" : `IIDX${version}`,
        })}
      </button>
    </div>
  );
};
