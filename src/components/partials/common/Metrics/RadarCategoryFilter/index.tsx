import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { RadarCategory } from "@/types/stats/radar";
import { ALL_RADAR_CATEGORIES, RADAR_COLORS } from "@/constants/iidx/radars";
import { useTranslation } from "@/hooks/common/useTranslation";

interface RadarCategoryFilterProps {
  selectedCategories: Set<RadarCategory>;
  onToggle: (cat: RadarCategory) => void;
  /** チェックボックスDOM idの接頭辞。同一ページ内に複数配置する場合の衝突回避用。 */
  idPrefix: string;
}

const RadarCategoryFilter = ({
  selectedCategories,
  onToggle,
  idPrefix,
}: RadarCategoryFilterProps) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-bg/80 p-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-bpim-muted">
          {t("arenaAnalysis.radarCategory")}
        </span>
        {ALL_RADAR_CATEGORIES.map((cat) => {
          const active = selectedCategories.has(cat);
          return (
            <div key={cat} className="flex items-center gap-1.5">
              <Checkbox
                id={`${idPrefix}-${cat}`}
                checked={active}
                onCheckedChange={() => onToggle(cat)}
                className="h-4 w-4 border-bpim-border"
                style={
                  active
                    ? {
                        backgroundColor: RADAR_COLORS[cat],
                        borderColor: RADAR_COLORS[cat],
                      }
                    : {}
                }
              />
              <Label
                htmlFor={`${idPrefix}-${cat}`}
                className="cursor-pointer whitespace-nowrap text-xs font-bold text-bpim-text"
                style={{ color: active ? RADAR_COLORS[cat] : undefined }}
              >
                {cat}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RadarCategoryFilter;
