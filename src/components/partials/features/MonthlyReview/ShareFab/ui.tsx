"use client";

import { Share2, Copy, Check, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";
import {
  OGP_SECTION_KEYS,
  type OgpSectionKey,
} from "@/lib/monthly-review/ogpSections";

const SECTION_LABEL_KEYS: Record<OgpSectionKey, TranslationKey> = {
  topSongs: "monthlyReview.shareFab.sectionTopSongs",
  radar: "monthlyReview.shareFab.sectionRadar",
  growth: "monthlyReview.shareFab.sectionGrowth",
  arena: "monthlyReview.shareFab.sectionArena",
};

function SectionSlotRow({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: OgpSectionKey[];
  selected: OgpSectionKey;
  onSelect: (key: OgpSectionKey) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="text-[11px] font-semibold"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((key) => {
          const isSelected = key === selected;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="rounded-full px-4 py-2 text-xs font-semibold transition-colors"
              style={
                isSelected
                  ? {
                      background: "rgba(56,189,248,0.18)",
                      border: "1px solid rgba(56,189,248,0.5)",
                      color: "#38bdf8",
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.55)",
                    }
              }
            >
              {t(SECTION_LABEL_KEYS[key])}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: [OgpSectionKey, OgpSectionKey];
  onSelectLeft: (key: OgpSectionKey) => void;
  onSelectRight: (key: OgpSectionKey) => void;
  previewUrl: string;
  previewLoaded: boolean;
  onPreviewLoad: () => void;
  twitterUrl: string;
  pageUrl: string;
  onCopyUrl: () => void;
}

const ShareFabUI = ({
  open,
  onOpenChange,
  sections,
  onSelectLeft,
  onSelectRight,
  previewUrl,
  previewLoaded,
  onPreviewLoad,
  twitterUrl,
  pageUrl,
  onCopyUrl,
}: Props) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyUrl();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <button
        onClick={() => onOpenChange(true)}
        aria-label={t("monthlyReview.shareFab.fabLabel")}
        className="fixed right-4 bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm transition-transform hover:scale-105"
        style={{
          background: "rgba(56,189,248,0.15)",
          border: "1px solid rgba(56,189,248,0.4)",
          color: "#38bdf8",
        }}
      >
        <Share2 className="h-5 w-5" />
      </button>

      <DrawerContent
        className="border-white/10! text-white!"
        style={{ background: "#0a0a0f" }}
      >
        <DrawerHeader>
          <DrawerTitle className="text-white!">
            {t("monthlyReview.shareFab.title")}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-4 pb-8">
          <div className="flex flex-col gap-2">
            <div
              className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide"
              style={{ color: "rgba(56,189,248,0.85)" }}
            >
              <ImageIcon className="h-3 w-3" />
              {t("monthlyReview.shareFab.previewLabel")}
            </div>
            <div
              className="relative w-full overflow-hidden rounded-xl p-2"
              style={{
                maxWidth: 480,
                margin: "0 auto",
                border: "1px dashed rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div
                className="relative w-full overflow-hidden rounded-lg"
                style={{
                  aspectRatio: "1200 / 630",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                {!previewLoaded && (
                  <Skeleton className="absolute inset-0 h-full w-full bg-white/5!" />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={previewUrl}
                  src={previewUrl}
                  alt={t("monthlyReview.shareFab.title")}
                  onLoad={onPreviewLoad}
                  className="h-full w-full object-cover transition-opacity duration-300"
                  style={{ opacity: previewLoaded ? 1 : 0 }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <SectionSlotRow
              label={t("monthlyReview.shareFab.leftSlot")}
              options={OGP_SECTION_KEYS.filter((k) => k !== sections[1])}
              selected={sections[0]}
              onSelect={onSelectLeft}
            />
            <SectionSlotRow
              label={t("monthlyReview.shareFab.rightSlot")}
              options={OGP_SECTION_KEYS.filter((k) => k !== sections[0])}
              selected={sections[1]}
              onSelect={onSelectRight}
            />
          </div>

          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all hover:scale-105"
            style={{
              background: "rgba(29,161,242,0.15)",
              border: "1px solid rgba(29,161,242,0.4)",
              color: "#1da1f2",
            }}
          >
            <Share2 className="h-4 w-4" />
            {t("monthlyReview.shareFab.shareX")}
          </a>

          <div
            className="flex items-center gap-2 rounded-full px-4 py-2.5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span
              className="flex-1 truncate text-xs"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {pageUrl}
            </span>
            <button
              onClick={handleCopy}
              aria-label={t("monthlyReview.shareFab.copyUrl")}
              className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.75)",
              }}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {t("monthlyReview.shareFab.copyUrl")}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ShareFabUI;
