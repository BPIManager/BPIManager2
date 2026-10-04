import type { SiteStatsPeriod } from "@/types/siteStats";
import type { TranslationKey } from "@/lib/i18n/translations";
import { useTranslation } from "@/hooks/common/useTranslation";

const PERIOD_LABEL_KEYS: Record<SiteStatsPeriod, TranslationKey> = {
  all: "siteInfo.period.all",
  d90: "siteInfo.period.d90",
  d30: "siteInfo.period.d30",
  d7: "siteInfo.period.d7",
};
const PERIODS: SiteStatsPeriod[] = ["all", "d90", "d30", "d7"];

function PeriodTabs({
  value,
  onChange,
}: {
  value: SiteStatsPeriod;
  onChange: (p: SiteStatsPeriod) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex overflow-hidden rounded border border-bpim-border text-[10px]">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-2 py-0.5 transition-colors ${
            value === p
              ? "bg-bpim-primary text-bpim-surface"
              : "text-bpim-muted hover:bg-bpim-overlay"
          }`}
        >
          {t(PERIOD_LABEL_KEYS[p])}
        </button>
      ))}
    </div>
  );
}

export default PeriodTabs;
