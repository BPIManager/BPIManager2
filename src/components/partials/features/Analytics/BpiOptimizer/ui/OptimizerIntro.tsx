import { Save, Sparkles, Target } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "@/hooks/common/useTranslation";

const STEPS = [
  {
    icon: Target,
    titleKey: "optimizer.intro.step1Title",
    descKey: "optimizer.intro.step1Desc",
  },
  {
    icon: Sparkles,
    titleKey: "optimizer.intro.step2Title",
    descKey: "optimizer.intro.step2Desc",
  },
  {
    icon: Save,
    titleKey: "optimizer.intro.step3Title",
    descKey: "optimizer.intro.step3Desc",
  },
] as const;

const OptimizerIntro = () => {
  const { t } = useTranslation();

  return (
    <Alert
      variant="info"
      className="bg-linear-to-br from-bpim-primary/[0.07] via-transparent to-transparent"
    >
      <Sparkles />
      <AlertTitle className="text-sm font-black text-bpim-text">
        {t("optimizer.intro.title")}
      </AlertTitle>
      <AlertDescription className="w-full gap-5">
        <p className="text-xs leading-relaxed text-bpim-muted">
          {t("optimizer.intro.desc")}
        </p>

        <div className="relative flex w-full items-start justify-between">
          <div className="pointer-events-none absolute top-4 left-4 right-4 h-px bg-linear-to-r from-bpim-primary/40 via-bpim-primary/20 to-bpim-primary/40" />
          {STEPS.map((step) => (
            <div
              key={step.titleKey}
              className="flex w-20 flex-col items-center gap-1.5 text-center sm:w-28"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-bpim-primary/30 bg-bpim-bg text-bpim-primary">
                <step.icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-[11px] font-bold leading-tight text-bpim-text">
                {t(step.titleKey)}
              </span>
              <span className="hidden text-[10px] leading-snug text-bpim-muted sm:block">
                {t(step.descKey)}
              </span>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default OptimizerIntro;
