import { ExternalLink } from "lucide-react";
import { DashCard } from "@/components/ui/dashcard";
import { useTranslation } from "@/hooks/common/useTranslation";
import RadarSectionChart from "@/components/partials/common/DashBoard/Radar";
import type { Props } from "./types";

/** 新方式BPIの理論的な説明（Notion）。 */
const THEORY_URL = "https://app.notion.com/p/BPI-3d69989ca87a8187b66dd2345c04f1cb";
/** 新方式BPIの設計判断・経緯を追跡している GitHub issue。 */
const DESIGN_ISSUE_URL =
  "https://github.com/BPIManager/BPIManager2/issues/309";

export const NoticeCard = () => {
  const { t } = useTranslation();
  return (
    <DashCard className="border-amber-500/40 bg-amber-500/5 text-sm text-muted-foreground">
      <p>{t("newBpi.notice")}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <a
          href={THEORY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-bpim-primary hover:underline"
        >
          {t("newBpi.notice.theoryLink")}
          <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={DESIGN_ISSUE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-bpim-primary hover:underline"
        >
          {t("newBpi.notice.issueLink")}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </DashCard>
  );
};

export const SummaryCards = ({
  currentTotalBpi,
  newTotalBpi,
  comparableCount,
}: Pick<Props, "currentTotalBpi" | "newTotalBpi" | "comparableCount">) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <DashCard>
        <div className="text-xs text-muted-foreground">
          {t("newBpi.summary.currentTotal")}
        </div>
        <div className="mt-1 text-2xl font-bold">
          {currentTotalBpi !== null ? currentTotalBpi.toFixed(2) : "—"}
        </div>
      </DashCard>
      <DashCard>
        <div className="text-xs text-muted-foreground">
          {t("newBpi.summary.newTotal")}
        </div>
        <div className="mt-1 text-2xl font-bold">
          {newTotalBpi !== null ? newTotalBpi.toFixed(2) : "—"}
        </div>
      </DashCard>
      <DashCard>
        <div className="text-xs text-muted-foreground">
          {t("newBpi.summary.songCount")}
        </div>
        <div className="mt-1 text-2xl font-bold">{comparableCount}</div>
      </DashCard>
    </div>
  );
};

export const RadarComparisonCard = ({
  radarCurrent,
  radarNew,
}: Pick<Props, "radarCurrent" | "radarNew">) => {
  const { t } = useTranslation();
  if (!radarCurrent || !radarNew) return null;
  return (
    <DashCard>
      <p className="mb-2 text-xs text-muted-foreground">
        {t("newBpi.radar.desc")}
      </p>
      <RadarSectionChart data={radarCurrent} rivalData={radarNew} />
    </DashCard>
  );
};
