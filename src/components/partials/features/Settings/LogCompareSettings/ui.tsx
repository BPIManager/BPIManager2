"use client";

import { GitCompare } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useLogCompareDefault,
  type LogCompareDefaultConfig,
} from "@/hooks/logs/useLogCompareDefault";
import { versionsNonDisabledCollection } from "@/constants/iidx/versionTitles";
import { latestVersion } from "@/constants/iidx/iidxVersions";

export default function LogCompareSettingsUi() {
  const { t } = useTranslation();
  const { config, updateConfig } = useLogCompareDefault();
  const mode = config.mode;

  const fixedVersion = config.mode === "fixed" ? config.version : latestVersion;

  const versionOptions = versionsNonDisabledCollection.filter(
    (v) => v.value !== "INF",
  );

  return (
    <div className="mt-4 flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bpim-primary">
          <GitCompare className="h-4 w-4" />
          <span className="font-bold">{t("settings.logCompare.title")}</span>
        </div>
        <p className="text-sm text-bpim-muted">
          {t("settings.logCompare.desc")}
        </p>
      </div>
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <Select
          value={mode}
          onValueChange={(v) => {
            const nextMode = v as LogCompareDefaultConfig["mode"];
            updateConfig(
              nextMode === "previous"
                ? { mode: "previous" }
                : { mode: "fixed", version: fixedVersion },
            );
          }}
        >
          <SelectTrigger className="w-full md:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="previous">
              {t("settings.logCompare.mode.previous")}
            </SelectItem>
            <SelectItem value="fixed">
              {t("settings.logCompare.mode.fixed")}
            </SelectItem>
          </SelectContent>
        </Select>

        {mode === "fixed" && (
          <Select
            value={fixedVersion}
            onValueChange={(v) => updateConfig({ mode: "fixed", version: v })}
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {versionOptions.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
