import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { IIDX_LEVELS, IIDX_DIFFICULTIES } from "@/constants/diffs";

interface RivalFilterProps {
  levels: string[];
  difficulties: string[];
  onToggleLevel: (lv: string) => void;
  onToggleDifficulty: (diff: string) => void;
}

export const RivalFilter = ({
  levels,
  difficulties,
  onToggleLevel,
  onToggleDifficulty,
}: RivalFilterProps) => {
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-white/10 bg-slate-900/40 p-4 lg:flex-row lg:items-start lg:gap-10">
      <div className="flex flex-col gap-2.5">
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
          Level
        </span>
        <div className="flex flex-wrap gap-4">
          {IIDX_LEVELS.map((l) => (
            <div key={l} className="flex items-center gap-2">
              <Checkbox
                id={`lv-${l}`}
                checked={levels.includes(l)}
                onCheckedChange={() => onToggleLevel(l)}
                className="h-4 w-4 border-white/20 data-[state=checked]:bg-blue-600"
              />
              <Label
                htmlFor={`lv-${l}`}
                className="text-xs font-bold text-slate-200 cursor-pointer"
              >
                ☆{l}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
          Difficulty
        </span>
        <div className="flex flex-wrap gap-4">
          {IIDX_DIFFICULTIES.map((d) => (
            <div key={d} className="flex items-center gap-2">
              <Checkbox
                id={`diff-${d}`}
                checked={difficulties.includes(d)}
                onCheckedChange={() => onToggleDifficulty(d)}
                className="h-4 w-4 border-white/20 data-[state=checked]:bg-blue-600"
              />
              <Label
                htmlFor={`diff-${d}`}
                className="text-xs font-bold text-slate-200 cursor-pointer uppercase"
              >
                {d}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
