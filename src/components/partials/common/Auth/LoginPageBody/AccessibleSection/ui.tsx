import { ReactNode } from "react";
import { Sparkles, Swords, ListMusic, Shuffle } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";

const FeatureRow = ({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-3 rounded-lg border border-bpim-border bg-bpim-surface/50 p-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bpim-primary/10 text-bpim-primary">
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-sm font-bold text-bpim-text">{title}</span>
      <span className="mt-0.5 text-xs leading-relaxed text-bpim-muted">
        {description}
      </span>
    </div>
  </div>
);

const AccessibleSection = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-bpim-border bg-bpim-surface-2/30 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex shrink-0 items-center justify-center rounded-xl bg-bpim-primary/10 p-3 text-bpim-primary shadow-inner">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-bpim-primary/80">
            {t("login.accessible.tag")}
          </span>
          <h3 className="text-xl font-bold leading-tight text-bpim-text md:text-2xl">
            {t("login.accessible.title")}
          </h3>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-bpim-muted">
        {t("login.accessible.desc")}
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <FeatureRow
          icon={<Swords className="h-4 w-4" />}
          title={t("login.accessible.feature1.title")}
          description={t("login.accessible.feature1.desc")}
        />
        <FeatureRow
          icon={<ListMusic className="h-4 w-4" />}
          title={t("login.accessible.feature2.title")}
          description={t("login.accessible.feature2.desc")}
        />
        <FeatureRow
          icon={<Shuffle className="h-4 w-4" />}
          title={t("login.accessible.feature3.title")}
          description={t("login.accessible.feature3.desc")}
        />
      </div>
    </div>
  );
};

export default AccessibleSection;
