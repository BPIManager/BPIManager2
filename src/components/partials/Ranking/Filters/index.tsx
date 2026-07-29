import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { versionsNonDisabledCollection } from "@/constants/iidx/versionTitles";
import { JAPAN_PREFECTURES } from "@/constants/iidx/rankingPrefectures";
import { ARENA_RANK_ORDER } from "@/constants/iidx/arenaRanks";
import { useTranslation } from "@/hooks/common/useTranslation";

interface RankingFiltersProps {
  version: { value: string; onChange: (v: string) => void };
  category: {
    value: string;
    onChange: (c: string) => void;
    options: { value: string; label: string }[];
    /** 最新バージョン以外ではtotalBpi/songs以外の選択肢を隠す */
    isLatestVersion: boolean;
  };
  /** 指定した場合のみエリア/アリーナクラスの絞り込み行を表示する(totalBpiカテゴリ専用) */
  areaArenaFilter?: {
    area: string;
    onAreaChange: (v: string) => void;
    arenaClass: string;
    onArenaClassChange: (v: string) => void;
  };
}

/**
 * ランキングのバージョン/カテゴリ選択と、totalBpiカテゴリ限定の
 * エリア/アリーナクラス絞り込みをまとめたフィルターUI。
 */
export const RankingFilters = ({
  version,
  category,
  areaArenaFilter,
}: RankingFiltersProps) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex gap-3 mb-4">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
            Version
          </label>
          <Select value={version.value} onValueChange={version.onChange}>
            <SelectTrigger className="w-full h-9 border-bpim-border bg-bpim-bg text-bpim-text focus:ring-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
              {versionsNonDisabledCollection.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
            Category
          </label>
          <Select value={category.value} onValueChange={category.onChange}>
            <SelectTrigger className="w-full h-9 border-bpim-border bg-bpim-bg text-bpim-text focus:ring-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
              {category.options
                .filter(
                  (c) =>
                    category.isLatestVersion ||
                    c.value === "totalBpi" ||
                    c.value === "songs",
                )
                .map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {areaArenaFilter && (
        <div className="flex gap-3 mb-4">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
              {t("ranking.filter.area")}
            </label>
            <Select
              value={areaArenaFilter.area || "all"}
              onValueChange={areaArenaFilter.onAreaChange}
            >
              <SelectTrigger className="w-full h-9 border-bpim-border bg-bpim-bg text-bpim-text focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
                <SelectItem value="all">{t("ranking.filter.all")}</SelectItem>
                {JAPAN_PREFECTURES.map((pref) => (
                  <SelectItem key={pref} value={pref}>
                    {pref}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
              {t("ranking.filter.arenaClass")}
            </label>
            <Select
              value={areaArenaFilter.arenaClass || "all"}
              onValueChange={areaArenaFilter.onArenaClassChange}
            >
              <SelectTrigger className="w-full h-9 border-bpim-border bg-bpim-bg text-bpim-text focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
                <SelectItem value="all">{t("ranking.filter.all")}</SelectItem>
                {ARENA_RANK_ORDER.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </>
  );
};
