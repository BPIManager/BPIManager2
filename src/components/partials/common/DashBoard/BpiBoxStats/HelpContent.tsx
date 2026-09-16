import { ExternalLink } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";

const BPICALC_NPM_URL = "https://www.npmjs.com/package/@bpim/bpicalc";

const BpiBoxHelpContent = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <section>
        <p className="font-bold text-bpim-primary border-b border-bpim-primary/30 mb-1">
          {t("dashboard.bpiBoxStats.help.scopeTitle")}
        </p>
        <p>
          {t("dashboard.bpiBoxStats.help.scopeBefore")}
          <span className="text-bpim-warning">
            {t("dashboard.bpiBoxStats.help.scopeHighlight")}
          </span>
          {t("dashboard.bpiBoxStats.help.scopeAfter")}
        </p>
      </section>

      <section>
        <p className="font-bold text-bpim-primary border-b border-bpim-primary/30 mb-1">
          {t("dashboard.bpiBoxStats.help.itemsTitle")}
        </p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            <span className="font-bold">
              {t("dashboard.bpiBoxStats.help.periodBpiLabel")}
            </span>
            :{t("dashboard.bpiBoxStats.help.periodBpiDesc")}
            <a
              href={BPICALC_NPM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex w-fit items-center gap-1 font-medium text-bpim-primary hover:underline"
            >
              {t("common.bpicalcLink")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </li>
          <li>
            <span className="font-bold text-bpim-primary">
              {t("dashboard.bpiBoxStats.help.bandLabel")}
            </span>
            : {t("dashboard.bpiBoxStats.help.bandDesc")}
            <ul className="list-none pl-4 mt-1 space-y-1 text-bpim-muted">
              <li>
                ・
                <span className="italic">
                  {t("dashboard.bpiBoxStats.help.bandTopLabel")}
                </span>
                ：{t("dashboard.bpiBoxStats.help.bandTopDesc")}
              </li>
            </ul>
          </li>
          <li>
            <span className="font-bold text-bpim-warning">
              {t("dashboard.bpiBoxStats.help.efficiencyLabel")}
            </span>
            : {t("dashboard.bpiBoxStats.help.efficiencyDesc")}
            <span className="text-bpim-warning">
              {t("dashboard.bpiBoxStats.help.efficiencyHighlight")}
            </span>
            {t("dashboard.bpiBoxStats.help.efficiencyAfter")}
          </li>
          <li>
            <span className="font-bold">
              {t("dashboard.bpiBoxStats.help.minMaxLabel")}
            </span>
            : {t("dashboard.bpiBoxStats.help.minMaxDesc")}
          </li>
        </ul>
      </section>

      <section className="bg-bpim-overlay/40 p-2 rounded text-[10px]">
        <p>{t("dashboard.bpiBoxStats.help.note1")}</p>
      </section>
      <section className="bg-bpim-overlay/40 p-2 rounded text-[10px] space-y-1.5">
        <p className="flex items-start gap-1">
          <span className="text-bpim-danger font-bold">※</span>
          <span className="font-bold border-b border-bpim-danger/50">
            {t("dashboard.bpiBoxStats.help.warningLabel")}
          </span>
        </p>
        <p className="text-bpim-muted italic">
          {t("dashboard.bpiBoxStats.help.note2")}
        </p>
      </section>
    </div>
  );
};

export default BpiBoxHelpContent;
