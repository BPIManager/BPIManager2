import { TrendingUp } from "lucide-react";
import { DashCard } from "@/components/ui/dashcard";
import { useTranslation } from "@/hooks/common/useTranslation";

export const MockCurrentBpiCard = () => {
  const { t } = useTranslation();
  return (
    <DashCard>
      <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-muted">
        {t("login.showcase.growth.cardTitle")}
      </span>
      <div className="mt-4 flex flex-row items-end gap-6">
        <span className="font-mono text-4xl font-bold tabular-nums leading-none tracking-tighter text-bpim-text">
          47.83
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-muted">
            {t("login.showcase.growth.rankLabel")}
          </span>
          <span className="text-lg font-bold text-bpim-text">
            ~62
            <span className="ml-1 text-xs font-normal text-bpim-muted">
              {t("login.showcase.growth.rankUnit")}
            </span>
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-bpim-primary/30 bg-bpim-primary/5 px-3 py-2">
        <span className="font-mono text-[10px] text-bpim-muted">
          2025-04-01
        </span>
        <span className="font-mono text-sm text-bpim-muted">38.21</span>
        <span className="ml-auto flex items-center gap-1 font-mono text-sm font-bold text-bpim-success">
          <TrendingUp className="h-3 w-3" />
          +9.62
        </span>
      </div>
    </DashCard>
  );
};
