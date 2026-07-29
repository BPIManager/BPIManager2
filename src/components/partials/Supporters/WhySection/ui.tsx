import { Heart, Sparkles, ShieldCheck, GitPullRequest, HandHeart } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";

export const WhySection = () => {
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bpim-primary/10 text-bpim-primary shadow-inner">
          <HandHeart className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-bpim-text">
          {t("support.whyTitle")}
        </h2>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-bpim-border bg-bpim-surface-2/30 p-6 backdrop-blur-sm md:p-8">
        <Sparkles className="absolute -right-4 -top-4 h-24 w-24 opacity-[0.03] text-bpim-primary" />

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4 text-sm leading-relaxed text-bpim-muted">
            <p>{t("support.whyDesc1")}</p>
            <p>{t("support.whyDesc2")}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("section-donation")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="flex items-center gap-2 rounded-xl border border-bpim-primary/30 bg-bpim-primary/5 px-4 py-2 text-sm font-bold text-bpim-primary transition-colors hover:bg-bpim-primary/10"
              >
                <Heart className="h-3.5 w-3.5" />
                {t("support.btnDonate")}
              </button>
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("section-oss")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/5 px-4 py-2 text-sm font-bold text-emerald-400 transition-colors hover:bg-emerald-400/10"
              >
                <GitPullRequest className="h-3.5 w-3.5" />
                {t("support.btnOss")}
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4 rounded-xl bg-bpim-bg/40 p-5 border border-bpim-border/50">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bpim-primary text-bpim-bg">
                <ShieldCheck className="h-3 w-3" />
              </div>
              <div className="space-y-1">
                <p className="text-[13px] font-bold text-bpim-text">
                  {t("support.fairnessTitle")}
                </p>
                <p className="text-sm text-bpim-muted">
                  {t("support.fairnessDesc1")}
                  <span className="font-bold text-bpim-primary">
                    {t("support.fairnessHighlight")}
                  </span>
                  {t("support.fairnessDesc2")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-bpim-border pt-4">
              <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bpim-primary text-bpim-bg">
                <Heart className="h-3 w-3" />
              </div>
              <div className="space-y-1">
                <p className="text-[13px] font-bold text-bpim-text">
                  {t("support.howTitle")}
                </p>
                <p className="text-sm text-bpim-muted">{t("support.howDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
