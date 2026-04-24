"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { THEMES, applyTheme, getStoredTheme } from "@/hooks/common/useTheme";
import { FONTS, applyFont, getStoredFont } from "@/hooks/common/useFont";
import { Check, Palette, Type } from "lucide-react";
import { ThemeId } from "@/types/ui/theme";
import { FontId } from "@/types/ui/font";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ThemeSettingsUi() {
  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState<ThemeId>("dark-blue");
  const [currentFont, setCurrentFont] = useState<FontId>("default");

  useEffect(() => {
    setCurrent(getStoredTheme());
    setCurrentFont(getStoredFont());
  }, []);

  const handleSelect = (id: ThemeId) => {
    setCurrent(id);
    applyTheme(id);
  };

  const handleFontSelect = (id: FontId) => {
    setCurrentFont(id);
    applyFont(id);
  };

  const currentTheme = THEMES.find((t) => t.id === current);
  const currentFontLabel = FONTS.find((f) => f.id === currentFont)?.label;

  const darkStandard = THEMES.filter(
    (t) =>
      t.mode === "dark" &&
      !["dark-abyss", "dark-midnight", "dark-forest", "dark-ember", "dark-onsen"].includes(t.id),
  );
  const darkVivid = THEMES.filter((t) =>
    ["dark-abyss", "dark-midnight", "dark-forest", "dark-ember", "dark-onsen"].includes(t.id),
  );
  const lightThemes = THEMES.filter((t) => t.mode === "light");

  return (
    <>
      <div className="mt-4 flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-bpim-primary">
            <Palette className="h-4 w-4" />
            <span className="font-bold">テーマ・フォント設定</span>
          </div>
          <p className="text-sm text-bpim-muted">
            アプリ全体の配色とフォントを選択します。設定はブラウザに保存されます。
          </p>
          {currentTheme && (
            <div className="mt-1 flex items-center gap-2 text-xs text-bpim-muted">
              <span
                className="inline-block h-3 w-3 rounded-full border border-bpim-border"
                style={{ background: currentTheme.preview.primary }}
              />
              <span>{currentTheme.label}</span>
              {currentFontLabel && (
                <>
                  <span className="text-bpim-border">·</span>
                  <Type className="h-3 w-3" />
                  <span>{currentFontLabel}</span>
                </>
              )}
            </div>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="w-full md:w-auto gap-2"
        >
          <Palette className="h-4 w-4" />
          外観を変更
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-2xl border-bpim-border bg-bpim-bg p-0 overflow-hidden shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-bpim-border">
            <DialogTitle className="text-lg font-bold text-bpim-text">
              テーマ・フォント設定
            </DialogTitle>
            <p className="text-xs text-bpim-muted mt-1">
              設定はブラウザに保存されます
            </p>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[65vh] p-6 flex flex-col gap-6">
            <ThemeGroup label="ダーク" themes={darkStandard} current={current} onSelect={handleSelect} />
            <ThemeGroup label="ライト" themes={lightThemes} current={current} onSelect={handleSelect} />
            <ThemeGroup label="ゲーミング" themes={darkVivid} current={current} onSelect={handleSelect} />

            <div className="border-t border-bpim-border pt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-bpim-primary">
                  <Type className="h-4 w-4" />
                  <span className="font-bold text-sm">フォント設定</span>
                </div>
                <p className="text-xs text-bpim-muted">
                  アプリ全体のフォントを選択します。
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {FONTS.map((font) => (
                  <FontCard
                    key={font.id}
                    font={font}
                    selected={currentFont === font.id}
                    onSelect={handleFontSelect}
                  />
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold uppercase tracking-widest text-bpim-subtle">
        {label}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 md:grid-cols-6 lg:grid-cols-8">
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
        "group relative flex flex-col gap-1.5 rounded-xl border-2 p-2 text-left",
        "w-18 shrink-0 sm:w-auto sm:shrink",
        "transition-all duration-200 hover:scale-[1.03]",
        selected
          ? "border-bpim-primary shadow-[0_0_0_3px] shadow-bpim-primary/20"
          : "border-bpim-border hover:border-bpim-primary/50",
      )}
      style={{ background: preview.bg }}
    >
      <div
        className="flex h-10 w-full flex-col gap-1 overflow-hidden rounded-lg p-1.5"
        style={{ background: preview.surface }}
      >
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: preview.primary }} />
          <div className="h-1 w-8 rounded-full opacity-40" style={{ background: preview.text }} />
        </div>
        <div className="h-1 w-full rounded-full opacity-15" style={{ background: preview.text }} />
        <div className="mt-auto h-2.5 w-8 rounded" style={{ background: preview.primary, opacity: 0.85 }} />
      </div>

      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[10px] font-bold leading-tight" style={{ color: preview.text }}>
          {theme.label}
        </span>
        {selected && (
          <span
            className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full"
            style={{ background: preview.primary }}
          >
            <Check className="h-2 w-2 text-white" />
          </span>
        )}
      </div>
    </button>
  );
}

function FontCard({
  font,
  selected,
  onSelect,
}: {
  font: (typeof FONTS)[number];
  selected: boolean;
  onSelect: (id: FontId) => void;
}) {
  return (
    <button
      onClick={() => onSelect(font.id)}
      className={cn(
        "flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left",
        "transition-all duration-200 hover:scale-[1.01]",
        selected
          ? "border-bpim-primary bg-bpim-surface shadow-[0_0_0_3px] shadow-bpim-primary/20"
          : "border-bpim-border bg-bpim-surface hover:border-bpim-primary/50",
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span
          className="text-sm font-bold text-bpim-text"
          style={font.id !== "default" ? { fontFamily: font.cssFamily } : undefined}
        >
          {font.label}
        </span>
        <span
          className="text-xs text-bpim-muted"
          style={font.id !== "default" ? { fontFamily: font.cssFamily } : undefined}
        >
          ABCabc あいうえお アイウエオ 漢字
        </span>
      </div>
      {selected && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bpim-primary">
          <Check className="h-3 w-3 text-white" />
        </span>
      )}
    </button>
  );
}
