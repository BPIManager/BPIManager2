import { DashCard } from "@/components/ui/dashcard";
import { useTranslation } from "@/hooks/common/useTranslation";
import { RIVAL_ROWS } from "../mocks";

export const MockRivalBars = () => {
  const { t } = useTranslation();
  return (
    <DashCard>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-bpim-muted">
          {t("login.showcase.rivals.chartTitle")}
        </h3>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-bpim-primary" />
            <span className="text-bpim-primary">WIN</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-bpim-overlay" />
            <span className="text-bpim-muted">DRAW</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-bpim-danger" />
            <span className="text-bpim-danger">LOSE</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {RIVAL_ROWS.map((r, idx) => {
          const winRate = (r.win / r.total) * 100;
          const drawRate = (r.draw / r.total) * 100;
          const loseRate = (r.lose / r.total) * 100;
          return (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-bpim-text">
                  {r.name}
                </span>
                <span className="text-[10px] text-bpim-muted">
                  {r.total}
                  {t("login.showcase.rivals.compareUnit")}
                </span>
              </div>
              <div className="relative h-4.5 w-full overflow-hidden rounded-sm bg-bpim-surface-2/60">
                <div className="flex h-full w-full">
                  <div
                    className="relative h-full bg-bpim-primary"
                    style={{ width: `${winRate}%` }}
                  >
                    {winRate > 10 && (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-[10px] font-bold text-white">
                          {r.win}
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    className="relative h-full bg-bpim-overlay"
                    style={{ width: `${drawRate}%` }}
                  />
                  <div
                    className="relative h-full flex-1 bg-bpim-danger"
                    style={{ width: `${loseRate}%` }}
                  >
                    {loseRate > 10 && (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-[10px] font-bold text-white">
                          {r.lose}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashCard>
  );
};
