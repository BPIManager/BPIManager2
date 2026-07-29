import {
  HelpCircle,
  BarChart2,
  ArrowUpDown,
  Ticket,
  ThumbsUp,
} from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";

export function TicketFeatureDescription() {
  const { t } = useTranslation();

  const sortOptions = [
    {
      label: t("tickets.sortPatternScore"),
      desc: t("tickets.feature.sortPatternScoreDesc"),
    },
    {
      label: t("tickets.sortBpiGap"),
      desc: t("tickets.feature.sortBpiGapDesc"),
    },
    {
      label: t("tickets.sortBpi"),
      desc: t("tickets.feature.sortBpiDesc"),
    },
  ];

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-bpim-border bg-bpim-surface/40 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-bpim-border pb-4">
        <HelpCircle className="h-5 w-5 text-bpim-primary" />
        <h3 className="text-base font-bold text-bpim-text">
          {t("tickets.feature.title")}
        </h3>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-bpim-primary" />
            <h4 className="text-sm font-bold text-bpim-text">
              {t("tickets.feature.whatYouCan")}
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-bpim-muted">
            {t("tickets.feature.whatYouCanDesc1")}
          </p>
          <p className="text-xs leading-relaxed text-bpim-muted">
            {t("tickets.feature.whatYouCanDesc2Pre")}
            <br />
            {t("tickets.feature.whatYouCanDesc2Post")}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-bpim-primary" />
            <h4 className="text-sm font-bold text-bpim-text">
              {t("tickets.feature.scoreModeTitle")}
            </h4>
          </div>
          <ul className="flex flex-col gap-3">
            <li className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-bpim-text">
                {t("tickets.feature.scoreRawLabel")}
              </span>
              <span className="text-[11px] leading-relaxed text-bpim-muted">
                {t("tickets.feature.scoreRawDescPre")}
                <span className="text-bpim-text font-semibold">
                  {t("tickets.feature.scoreRawDescBold")}
                </span>
                {t("tickets.feature.scoreRawDescPost")}
              </span>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-bpim-text">
                {t("tickets.feature.scoreRelativeLabel")}
              </span>
              <span className="text-[11px] leading-relaxed text-bpim-muted">
                {t("tickets.feature.scoreRelativeDescPre")}
                <span className="text-bpim-text font-semibold">
                  {t("tickets.feature.scoreRelativeDescBold")}
                </span>
                {t("tickets.feature.scoreRelativeDescPost")}
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-bpim-primary" />
            <h4 className="text-sm font-bold text-bpim-text">
              {t("tickets.feature.sortTitle")}
            </h4>
          </div>
          <ul className="flex flex-col gap-2">
            {sortOptions.map(({ label, desc }) => (
              <li key={label} className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-bpim-text">
                  {label}
                </span>
                <span className="text-[11px] leading-relaxed text-bpim-muted">
                  {desc}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-bpim-primary" />
            <h4 className="text-sm font-bold text-bpim-text">
              {t("tickets.feature.voteTitle")}
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-bpim-muted">
            {t("tickets.feature.voteDesc1")}
            <br />
            {t("tickets.feature.voteNote")}
          </p>
          <p className="text-xs leading-relaxed text-bpim-muted">
            {t("tickets.feature.voteDesc2")}
          </p>
        </div>
      </div>

      <p className="border-t border-bpim-border pt-4 text-[11px] text-bpim-muted">
        {t("tickets.feature.disclaimer")}
      </p>
    </div>
  );
}
