import { useTranslation } from "@/hooks/common/useTranslation";
import { btnActive, btnBase } from "./_shared";

export const YearGrid = ({
  availableYears,
  onYearClick,
  isCurrentYearMode,
  currentPeriod,
  version,
  currentVersion,
}: {
  availableYears: string[];
  onYearClick: (year: string) => void;
  isCurrentYearMode: boolean;
  currentPeriod: string;
  version: string;
  currentVersion: string;
}) => {
  const { t, tFormat } = useTranslation();

  return (
    <div>
      <p
        className="mb-2 text-[10px] font-bold tracking-[0.2em] uppercase"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {t("monthlyReview.period.selectYear")}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {availableYears.map((y) => {
          const isSelected =
            isCurrentYearMode &&
            currentPeriod === y &&
            version === currentVersion;
          return (
            <button
              key={y}
              onClick={() => onYearClick(y)}
              className="rounded-md px-3 py-1.5 text-xs font-bold transition-all"
              style={
                isSelected
                  ? {
                      ...btnActive,
                      background: "rgba(52,211,153,0.2)",
                      borderColor: "rgba(52,211,153,0.4)",
                      color: "#34d399",
                    }
                  : btnBase
              }
              onMouseEnter={(e) =>
                !isSelected &&
                (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
              }
              onMouseLeave={(e) =>
                !isSelected &&
                (e.currentTarget.style.background = "transparent")
              }
            >
              {tFormat("monthlyReview.period.yearLabel", { year: y })}
            </button>
          );
        })}
      </div>
    </div>
  );
};
