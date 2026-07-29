import {
  HelpCircle,
  History,
  Lightbulb,
  Save,
  Star,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/hooks/common/useTranslation";

export const OptimizerGuide = () => {
  const { t } = useTranslation();
  return (
  <Accordion type="single" collapsible className="w-full mt-4">
    <AccordionItem
      value="guide"
      className="border border-bpim-border bg-bpim-surface/50 rounded-xl px-4 overflow-hidden"
    >
      <AccordionTrigger className="text-sm font-bold text-bpim-muted hover:text-bpim-text py-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-bpim-primary" />
          {t("optimizer.guide.title")}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-6 space-y-6 text-bpim-text">
        <section className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-bpim-primary flex items-center gap-2">
            <Target className="h-3.5 w-3.5" /> {t("optimizer.guide.conceptTitle")}
          </h4>
          <p className="text-xs leading-relaxed text-bpim-muted">
            {t("optimizer.guide.concept")}
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-bpim-subtle">
              {t("optimizer.guide.settingsTitle")}
            </h4>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <Zap className="h-4 w-4 text-yellow-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold">{t("optimizer.guide.fastestLabel")}</p>
                  <p className="text-[11px] text-bpim-muted leading-snug">
                    <b>{t("optimizer.guide.fastestTerm")}</b>
                    {t("optimizer.guide.fastestDesc")}
                    <b>{t("optimizer.guide.flexibleTerm")}</b>
                    {t("optimizer.guide.flexibleDesc")}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Star className="h-4 w-4 text-bpim-primary shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold">
                    {t("optimizer.guide.strengthLabel")}
                  </p>
                  <p className="text-[11px] text-bpim-muted leading-snug">
                    {t("optimizer.guide.strengthDesc")}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <TrendingUp className="h-4 w-4 text-bpim-primary shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold">
                    {t("optimizer.guide.considerBpiLabel")}
                  </p>
                  <p className="text-[11px] text-bpim-muted leading-snug">
                    {t("optimizer.guide.considerBpiDesc")}
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-bpim-subtle">
              {t("optimizer.guide.resultsTitle")}
            </h4>
            <div className="bg-bpim-bg p-3 rounded-lg border border-bpim-border space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-full bg-bpim-primary/20 rounded-full overflow-hidden">
                  <div className="h-full bg-bpim-primary w-2/3" />
                </div>
                <span className="text-[10px] font-bold shrink-0">Impact</span>
              </div>
              <p className="text-[11px] text-bpim-muted leading-snug">
                {t("optimizer.guide.impactDesc")}
              </p>
            </div>
          </section>
        </div>

        <section className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-bpim-primary flex items-center gap-2">
            <Save className="h-3.5 w-3.5" /> {t("optimizer.guide.saveTitle")}
          </h4>
          <p className="text-xs leading-relaxed text-bpim-muted">
            {t("optimizer.guide.saveDesc")}
          </p>
          <div className="bg-bpim-bg border border-bpim-border rounded-lg p-3 flex items-start gap-2 mt-1">
            <History className="h-3.5 w-3.5 text-bpim-muted shrink-0 mt-0.5" />
            <p className="text-[11px] text-bpim-muted leading-snug">
              {t("optimizer.guide.multiPlanNote")}
            </p>
          </div>
        </section>

        <div className="bg-bpim-primary/5 border border-bpim-primary/20 rounded-lg p-4 flex gap-3">
          <Lightbulb className="h-5 w-5 text-bpim-primary shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-bpim-primary">
              {t("optimizer.guide.tipTitle")}
            </p>
            <p className="text-[11px] text-bpim-muted leading-relaxed">
              {t("optimizer.guide.tipDesc")}
            </p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
  );
};
