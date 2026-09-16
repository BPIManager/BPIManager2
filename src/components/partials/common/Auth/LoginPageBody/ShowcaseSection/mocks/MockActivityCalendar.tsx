import { DashCard } from "@/components/ui/dashcard";
import { useTranslation } from "@/hooks/common/useTranslation";
import { ACTIVITY_MOCK, ACTIVITY_COLORS } from "../mocks";

export const MockActivityCalendar = () => {
  const { t } = useTranslation();
  return (
    <DashCard>
      <p className="mb-4 text-xs font-bold text-bpim-muted">
        {t("login.showcase.dist.calendarTitle")}
      </p>
      <div className="overflow-hidden">
        <div
          style={{
            display: "grid",
            gridTemplateRows: "repeat(7, 11px)",
            gridTemplateColumns: "repeat(20, 11px)",
            gridAutoFlow: "column",
            gap: "3px",
          }}
        >
          {ACTIVITY_MOCK.map((level, i) => (
            <div
              key={i}
              className="rounded-xs"
              style={{
                width: 11,
                height: 11,
                backgroundColor: ACTIVITY_COLORS[level],
              }}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-bpim-muted">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((v) => (
          <div
            key={v}
            className="h-2.5 w-2.5 rounded-xs"
            style={{ backgroundColor: ACTIVITY_COLORS[v] }}
          />
        ))}
        <span>More</span>
      </div>
    </DashCard>
  );
};
