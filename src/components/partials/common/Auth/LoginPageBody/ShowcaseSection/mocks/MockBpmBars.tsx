import { DashCard } from "@/components/ui/dashcard";
import { getBpiColorStyle } from "@/constants/theme/bpiColor";
import { useTranslation } from "@/hooks/common/useTranslation";
import { BPM_MOCK_DATA, CHART_ANIMS } from "../mocks";

export const MockBpmBars = () => {
  const { t } = useTranslation();
  const BPI_MIN = -15;
  const scaleMax = 60;
  const range = scaleMax - BPI_MIN;

  return (
    <DashCard>
      <style dangerouslySetInnerHTML={{ __html: CHART_ANIMS }} />
      <h3 className="mb-4 text-xs font-bold uppercase text-bpim-muted">
        {t("login.showcase.weakness.bpmTitle")}
      </h3>
      <div className="flex flex-col gap-2.5">
        {BPM_MOCK_DATA.map((row, i) => {
          const myColor = getBpiColorStyle(row.myBpi).bg;
          const rivalColor = getBpiColorStyle(row.rivalBpi).bg;
          const myWidth = ((row.myBpi - BPI_MIN) / range) * 100;
          const rivalWidth = ((row.rivalBpi - BPI_MIN) / range) * 100;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="w-15 shrink-0 text-right text-[10px] font-bold text-bpim-muted">
                {row.label}
              </span>
              <div className="flex flex-1 flex-col gap-0.75">
                <div
                  className="h-2.25 rounded-r-sm"
                  style={{
                    width: `${myWidth}%`,
                    backgroundColor: myColor,
                    animation: `growWidth 0.5s ease-out ${i * 0.07}s both`,
                  }}
                />
                <div
                  className="h-2.25 rounded-r-sm opacity-45"
                  style={{
                    width: `${rivalWidth}%`,
                    backgroundColor: rivalColor,
                    animation: `growWidth 0.5s ease-out ${i * 0.07 + 0.03}s both`,
                  }}
                />
              </div>
              <div className="w-10 shrink-0">
                <span
                  className="text-[11px] font-bold"
                  style={{ color: myColor }}
                >
                  {row.myBpi}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </DashCard>
  );
};
