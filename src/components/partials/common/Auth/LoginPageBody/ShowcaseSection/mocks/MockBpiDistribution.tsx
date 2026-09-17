import { DashCard } from "@/components/ui/dashcard";
import { getBpiColorStyle } from "@/constants/theme/bpiColor";
import { useTranslation } from "@/hooks/common/useTranslation";
import { BPI_DIST_MOCK, BPI_DIST_COUNTS, CHART_ANIMS } from "../mocks";

export const MockBpiDistribution = () => {
  const { t } = useTranslation();
  const maxCount = Math.max(...BPI_DIST_COUNTS);

  return (
    <DashCard>
      <style dangerouslySetInnerHTML={{ __html: CHART_ANIMS }} />
      <h3 className="mb-4 text-xs font-bold uppercase text-bpim-muted">
        {t("login.showcase.dist.chartTitle")}
      </h3>
      <div className="flex h-35 items-end justify-between gap-0.75 px-1">
        {BPI_DIST_MOCK.map((item, i) => {
          const color = getBpiColorStyle(item.bpi).bg;
          const heightPct = (BPI_DIST_COUNTS[i] / maxCount) * 100;
          return (
            <div key={i} className="flex flex-1 flex-col items-center">
              <div className="relative flex h-27.5 w-full flex-col justify-end">
                <div
                  className="w-full origin-bottom rounded-t-xs"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: color,
                    opacity: 0.85,
                    animation: `bounceGrow 0.6s ease-out ${i * 0.04}s both`,
                  }}
                />
              </div>
              <span
                className="mt-1 truncate text-[7px] font-bold text-bpim-muted"
                style={{ maxWidth: "100%" }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </DashCard>
  );
};
