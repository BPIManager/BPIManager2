import { DashCard } from "@/components/ui/dashcard";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/common/useTranslation";
import { AAA_TABLE_MOCK } from "../mocks";

/** 実際のAAATableカード(src/components/partials/common/Metrics/AAATable/table.tsx)の色分けを踏襲 */
const getGapColor = (my: number, target: number, maxScore: number) => {
  if (my === 0) return { bg: "bg-bpim-surface-2", text: "text-bpim-text" };
  const gapPct = ((my - target) / maxScore) * 100;
  if (gapPct < -5) return { bg: "bg-[#FF8C8C]", text: "text-slate-950" };
  if (gapPct < 0) return { bg: "bg-[#FFE999]", text: "text-slate-950" };
  if (gapPct <= 5) return { bg: "bg-[#EAEFF9]", text: "text-slate-950" };
  return { bg: "bg-[#6C9BD2]", text: "text-bpim-text" };
};

export const MockAaaTable = () => {
  const { t } = useTranslation();

  return (
    <DashCard>
      <h3 className="mb-4 text-xs font-bold uppercase text-bpim-muted">
        {t("login.showcase.aaa.chartTitle")}
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {AAA_TABLE_MOCK.map((item) => {
          const { bg, text } = getGapColor(item.my, item.target, item.maxScore);
          return (
            <div
              key={item.title}
              className={cn(
                "flex flex-col gap-2 rounded-md border border-bpim-border p-2.5",
                bg,
                text,
              )}
            >
              <h5 className="truncate text-[10px] font-black leading-none tracking-tight">
                {item.title}{" "}
                <span className="font-mono opacity-60">[{item.difficulty}]</span>
              </h5>
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-0">
                  <span className="text-[7px] font-black uppercase leading-none tracking-tighter opacity-60">
                    Target
                  </span>
                  <span className="font-mono text-xs font-black leading-none">
                    {item.target}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0">
                  <span className="text-[7px] font-black uppercase leading-none tracking-tighter opacity-60">
                    My EX
                  </span>
                  <span className="font-mono text-xs font-black leading-none">
                    {item.my > 0 ? item.my : "-"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashCard>
  );
};
