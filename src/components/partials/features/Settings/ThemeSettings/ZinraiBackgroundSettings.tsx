import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/common/useTranslation";
import {
  ZINRAI_BG_SPEEDS,
  setZinraiBgSettings,
  useZinraiBgSettings,
} from "@/hooks/zinrai/useZinraiBackground";

export default function ZinraiBackgroundSettings() {
  const { t } = useTranslation();
  const { enabled, speed } = useZinraiBgSettings();

  return (
    <div className="flex flex-col gap-4 border-t border-bpim-border pt-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bpim-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-bold">
            {t("settings.theme.zinraiBg.title")}
          </span>
        </div>
        <p className="text-xs text-bpim-muted">
          {t("settings.theme.zinraiBg.desc")}
        </p>
      </div>

      <label className="flex items-center justify-between gap-4 text-sm text-bpim-text">
        {t("settings.theme.zinraiBg.enabled")}
        <Switch
          checked={enabled}
          onCheckedChange={(v) => setZinraiBgSettings({ enabled: v })}
        />
      </label>

      <div
        className={cn(
          "flex items-center justify-between gap-4",
          !enabled && "opacity-50",
        )}
      >
        <span className="text-sm text-bpim-text">
          {t("settings.theme.zinraiBg.speed")}
        </span>
        <div className="flex gap-2">
          {ZINRAI_BG_SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={!enabled}
              onClick={() => setZinraiBgSettings({ speed: s })}
              className={cn(
                "rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition-colors duration-200",
                speed === s
                  ? "border-bpim-primary bg-bpim-surface text-bpim-text shadow-[0_0_0_3px] shadow-bpim-primary/20"
                  : "border-bpim-border bg-bpim-surface text-bpim-muted hover:border-bpim-primary/50",
              )}
            >
              {t(`settings.theme.zinraiBg.speed.${s}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
