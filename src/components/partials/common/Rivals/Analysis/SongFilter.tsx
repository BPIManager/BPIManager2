import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/common/useTranslation";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";

const LEVELS = [11, 12] as const;
const DIFFICULTIES = IIDX_DIFFICULTIES;
export type DifficultyName = (typeof DIFFICULTIES)[number];

const SongFilter = ({
  selectedLevels,
  selectedDifficulties,
  onLevelToggle,
  onDifficultyToggle,
}: {
  selectedLevels: Set<number>;
  selectedDifficulties: Set<DifficultyName>;
  onLevelToggle: (level: number) => void;
  onDifficultyToggle: (diff: DifficultyName) => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-bg/80 p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-bpim-muted">
            {t("rivals.analysis.level")}
          </span>
          {LEVELS.map((level) => {
            const active = selectedLevels.has(level);
            return (
              <div key={level} className="flex items-center gap-1.5">
                <Checkbox
                  id={`filter-level-${level}`}
                  checked={active}
                  onCheckedChange={() => onLevelToggle(level)}
                  className="h-4 w-4 border-bpim-border data-[state=checked]:bg-bpim-primary data-[state=checked]:border-bpim-primary"
                />
                <Label
                  htmlFor={`filter-level-${level}`}
                  className="cursor-pointer text-xs font-bold text-bpim-text"
                >
                  ☆{level}
                </Label>
              </div>
            );
          })}
        </div>
        <div className="h-4 w-px bg-bpim-border" />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-bpim-muted">
            {t("rivals.analysis.difficulty")}
          </span>
          {DIFFICULTIES.map((diff) => {
            const active = selectedDifficulties.has(diff);
            return (
              <div key={diff} className="flex items-center gap-1.5">
                <Checkbox
                  id={`filter-diff-${diff}`}
                  checked={active}
                  onCheckedChange={() => onDifficultyToggle(diff)}
                  className="h-4 w-4 border-bpim-border data-[state=checked]:bg-bpim-primary data-[state=checked]:border-bpim-primary"
                />
                <Label
                  htmlFor={`filter-diff-${diff}`}
                  className="cursor-pointer text-xs font-bold text-bpim-text"
                >
                  {diff}
                </Label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SongFilter;
