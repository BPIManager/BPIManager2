import { ReactNode } from "react";
import { ShieldCheck, Globe, LockIcon, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/common/useTranslation";

const PrivacyStatusCard = ({
  active,
  label,
  description,
  icon,
}: {
  active: boolean;
  label: string;
  description: string;
  icon: ReactNode;
}) => (
  <div
    className={cn(
      "flex items-center gap-3 rounded-lg border p-3 transition-all",
      active
        ? "border-bpim-primary/40 bg-bpim-primary/5 shadow-sm shadow-bpim-primary/5"
        : "border-bpim-border bg-bpim-surface/50 opacity-60",
    )}
  >
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
        active
          ? "bg-bpim-primary text-bpim-bg"
          : "bg-bpim-surface-2 text-bpim-muted",
      )}
    >
      {active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
    </div>
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 font-bold text-sm text-bpim-text">
        <span
          className={cn(
            "text-xs",
            active ? "text-bpim-primary" : "text-bpim-muted",
          )}
        >
          {icon}
        </span>
        {label}
      </div>
      <span className="text-[10px] text-bpim-muted leading-none mt-1">
        {description}
      </span>
    </div>
  </div>
);

const PrivacySection = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-bpim-border bg-bpim-surface-2/30 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex shrink-0 items-center justify-center rounded-xl bg-bpim-primary/10 p-3 text-bpim-primary shadow-inner">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-bpim-primary/80">
            {t("login.privacy.tag")}
          </span>
          <h3 className="text-xl font-bold leading-tight text-bpim-text md:text-2xl">
            {t("login.privacy.title")}
          </h3>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-bpim-muted">
        {t("login.privacy.desc")}
      </p>

      <div className="flex flex-col gap-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-bpim-muted/70 ml-1">
          {t("login.privacy.states")}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <PrivacyStatusCard
            active={true}
            label={t("login.privacy.public.label")}
            description={t("login.privacy.public.desc")}
            icon={<Globe className="h-4 w-4" />}
          />
          <PrivacyStatusCard
            active={false}
            label={t("login.privacy.private.label")}
            description={t("login.privacy.private.desc")}
            icon={<LockIcon className="h-4 w-4" />}
          />
        </div>
      </div>
    </div>
  );
};

export default PrivacySection;
