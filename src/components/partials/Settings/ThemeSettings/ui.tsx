"use client";

import { useEffect, useState } from "react";
import { LuPalette, LuCheck } from "react-icons/lu";
import { cn } from "@/lib/utils";
import {
  THEMES,
  type ThemeId,
  applyTheme,
  getStoredTheme,
} from "@/hooks/common/useTheme";

export default function ThemeSettingsUi() {
  const [current, setCurrent] = useState<ThemeId>("dark-blue");

  useEffect(() => {
    setCurrent(getStoredTheme());
  }, []);

  const handleSelect = (id: ThemeId) => {
    setCurrent(id);
    applyTheme(id);
  };

  const darkThemes = THEMES.filter((t) => t.mode === "dark");
  const lightThemes = THEMES.filter((t) => t.mode === "light");

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bpim-primary">
          <LuPalette className="h-4 w-4" />
          <span className="font-bold">テーマ設定</span>
        </div>
        <p className="text-sm text-bpim-muted">
          アプリ全体の配色を選択します。設定はブラウザに保存されます。
        </p>
      </div>

      <ThemeGroup
        label="ダーク"
        themes={darkThemes}
        current={current}
        onSelect={handleSelect}
      />

      <ThemeGroup
        label="ライト"
        themes={lightThemes}
        current={current}
        onSelect={handleSelect}
      />
    </div>
  );
}

function ThemeGroup({
  label,
  themes,
  current,
  onSelect,
}: {
  label: string;
  themes: typeof THEMES;
  current: ThemeId;
  onSelect: (id: ThemeId) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-widest text-bpim-subtle">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            selected={current === theme.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  selected,
  onSelect,
}: {
  theme: (typeof THEMES)[number];
  selected: boolean;
  onSelect: (id: ThemeId) => void;
}) {
  const { preview } = theme;

  return (
    <button
      onClick={() => onSelect(theme.id)}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border-2 p-3 text-left",
        "transition-all duration-200 hover:scale-[1.02]",
        selected
          ? "border-bpim-primary shadow-[0_0_0_3px] shadow-bpim-primary/20"
          : "border-bpim-border hover:border-bpim-primary/50",
      )}
      style={{ background: preview.bg }}
    >
      <div
        className="flex h-16 w-full flex-col gap-1.5 overflow-hidden rounded-lg p-2"
        style={{ background: preview.surface }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full"
            style={{ background: preview.primary }}
          />
          <div
            className="h-1.5 w-12 rounded-full opacity-40"
            style={{ background: preview.text }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <div
            className="h-1.5 w-full rounded-full opacity-20"
            style={{ background: preview.text }}
          />
          <div
            className="h-1.5 w-3/4 rounded-full opacity-20"
            style={{ background: preview.text }}
          />
        </div>
        <div
          className="mt-auto h-4 w-12 rounded-md"
          style={{ background: preview.primary, opacity: 0.85 }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: preview.text }}>
          {theme.label}
        </span>
        {selected && (
          <span
            className="flex h-4 w-4 items-center justify-center rounded-full"
            style={{ background: preview.primary }}
          >
            <LuCheck className="h-2.5 w-2.5 text-bpim-text" />
          </span>
        )}
      </div>
    </button>
  );
}
