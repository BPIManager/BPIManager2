import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/common/useTranslation";
import {
  V34_BG_SPEEDS,
  setV34BgSettings,
  useV34BgSettings,
} from "@/hooks/v34/useV34Background";

export default function V34BackgroundSettings() {
  const { t } = useTranslation();
  const { enabled, speed } = useV34BgSettings();

  return (
    <div className="flex flex-col gap-4 border-t border-bpim-border pt-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bpim-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-bold">
            {t("settings.theme.v34Bg.title")}
          </span>
        </div>
        <p className="text-xs text-bpim-muted">
          {t("settings.theme.v34Bg.desc")}
        </p>
      </div>

      <label className="flex items-center justify-between gap-4 text-sm text-bpim-text">
        {t("settings.theme.v34Bg.enabled")}
        <Switch
          checked={enabled}
          onCheckedChange={(v) => setV34BgSettings({ enabled: v })}
        />
      </label>

      <div
        className={cn(
          "flex items-center justify-between gap-4",
          !enabled && "opacity-50",
        )}
      >
        <span className="text-sm text-bpim-text">
          {t("settings.theme.v34Bg.speed")}
        </span>
        <div className="flex gap-2">
          {V34_BG_SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={!enabled}
              onClick={() => setV34BgSettings({ speed: s })}
              className={cn(
                "rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition-colors duration-200",
                speed === s
                  ? "border-bpim-primary bg-bpim-surface text-bpim-text shadow-[0_0_0_3px] shadow-bpim-primary/20"
                  : "border-bpim-border bg-bpim-surface text-bpim-muted hover:border-bpim-primary/50",
              )}
            >
              {t(`settings.theme.v34Bg.speed.${s}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
