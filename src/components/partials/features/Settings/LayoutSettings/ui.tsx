"use client";

import { useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayoutSettingsModal } from "@/components/partials/DashBoard/LayoutSettings";
import { useLayoutConfig } from "@/hooks/dashboard/useLayoutConfig";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function LayoutSettingsUi() {
  const [isOpen, setIsOpen] = useState(false);
  const { config, updateConfig } = useLayoutConfig();
  const { t } = useTranslation();

  return (
    <div className="mt-4 flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bpim-primary">
          <LayoutDashboard className="h-4 w-4" />
          <span className="font-bold">{t("settings.layout.title")}</span>
        </div>
        <p className="text-sm text-bpim-muted">
          {t("settings.layout.desc")}
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full md:w-auto gap-2"
      >
        <LayoutDashboard className="h-4 w-4" />
        {t("settings.layout.edit")}
      </Button>
      <DashboardLayoutSettingsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        config={config}
        onSave={updateConfig}
      />
    </div>
  );
}
