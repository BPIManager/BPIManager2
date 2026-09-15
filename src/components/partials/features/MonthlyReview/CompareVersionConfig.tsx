"use client";

import { useTranslation } from "@/hooks/common/useTranslation";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { Settings } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * 「最も伸びた曲」「レーダー別成長」で共通の設定UI（歯車アイコン→Popover）。
 * 全期間モードの比較先バージョン選択（`compareVersion`/`onChange`省略時は非表示）と、
 * 「最も伸びた曲」限定の「新規プレイを除く」チェックボックス
 * （`onExcludeNewPlaysChange`省略時は非表示）を、必要な方だけ出し分ける。
 */
const CompareVersionConfig = ({
  currentVersion,
  compareVersion,
  onChange,
  excludeNewPlays,
  onExcludeNewPlaysChange,
}: {
  currentVersion: string | undefined;
  compareVersion?: string;
  onChange?: (version: string) => void;
  excludeNewPlays?: boolean;
  onExcludeNewPlaysChange?: (excludeNewPlays: boolean) => void;
}) => {
  const { t } = useTranslation();
  const options = (IIDX_VERSIONS as readonly string[]).filter(
    (v) => v !== currentVersion,
  );
  const showVersionPicker = compareVersion && onChange;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="ml-auto flex items-center justify-center rounded-full p-1 transition-colors hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.4)" }}
          aria-label={t("monthlyReview.topSongs.compareVersionLabel")}
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-40 p-2"
        style={{
          background: "rgba(14,14,22,0.97)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {onExcludeNewPlaysChange && (
          <>
            <label className="flex items-center gap-2 px-1 py-1.5">
              <Checkbox
                checked={!!excludeNewPlays}
                onCheckedChange={(checked) =>
                  onExcludeNewPlaysChange(checked === true)
                }
              />
              <span
                className="text-xs font-semibold"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {t("monthlyReview.topSongs.excludeNewPlays")}
              </span>
            </label>
            {showVersionPicker && (
              <div
                className="my-2 h-px"
                style={{ background: "rgba(255,255,255,0.1)" }}
              />
            )}
          </>
        )}
        {showVersionPicker && (
          <>
            <p
              className="mb-2 px-1 text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {t("monthlyReview.topSongs.compareVersionLabel")}
            </p>
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {options.map((v) => {
                const isSelected = v === compareVersion;
                return (
                  <button
                    key={v}
                    onClick={() => onChange(v)}
                    className="rounded-md px-2 py-1.5 text-left text-xs font-bold transition-all"
                    style={
                      isSelected
                        ? {
                            background: "rgba(52,211,153,0.2)",
                            border: "1px solid rgba(52,211,153,0.4)",
                            color: "#34d399",
                          }
                        : {
                            border: "1px solid transparent",
                            color: "rgba(255,255,255,0.6)",
                          }
                    }
                  >
                    {v === "INF" ? "INF" : `IIDX${v}`}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default CompareVersionConfig;
