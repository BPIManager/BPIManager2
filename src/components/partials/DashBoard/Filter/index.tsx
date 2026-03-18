import { IIDX_LEVELS, IIDX_DIFFICULTIES } from "@/constants/diffs";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { versionsNonDisabledCollection } from "@/constants/versions";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const DashBoardFilter = () => {
  const { levels, diffs, version, toggleLevel, toggleDiff, setVersion } =
    useStatsFilter();

  return (
    <div className="rounded-lg border border-bpim-border bg-bpim-surface p-4">
      <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:gap-10">
        <div className="flex w-full flex-col gap-2 lg:min-w-[240px] lg:w-auto">
          <span className="text-[10px] font-bold uppercase text-bpim-muted md:text-xs">
            VERSION
          </span>
          <Select value={version} onValueChange={(val) => setVersion(val)}>
            <SelectTrigger className="h-8 w-full border-bpim-border bg-white/5 text-xs hover:bg-white/10 focus:ring-0">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent className="border-bpim-border bg-bpim-bg text-white">
              {versionsNonDisabledCollection.map((v) => (
                <SelectItem key={v.value} value={v.value} className="text-xs">
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full flex-col gap-2">
          <span className="text-[10px] font-bold uppercase text-bpim-muted md:text-xs">
            LEVEL
          </span>
          <div className="flex h-8 items-center flex-wrap gap-x-4 gap-y-2">
            {IIDX_LEVELS.map((l) => (
              <div key={l} className="flex items-center gap-2">
                <Checkbox
                  id={`level-${l}`}
                  checked={levels.includes(l)}
                  onCheckedChange={() => toggleLevel(l)}
                  className="h-4 w-4 border-white/20 data-[state=checked]:bg-bpim-primary"
                />
                <Label
                  htmlFor={`level-${l}`}
                  className="cursor-pointer text-xs font-medium leading-none md:text-sm"
                >
                  ☆{l}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2">
          <span className="text-[10px] font-bold uppercase text-bpim-muted md:text-xs">
            DIFFICULTY
          </span>
          <div className="flex h-8 items-center flex-wrap gap-x-4 gap-y-2">
            {IIDX_DIFFICULTIES.map((d) => (
              <div key={d} className="flex items-center gap-2">
                <Checkbox
                  id={`diff-${d}`}
                  checked={diffs.includes(d)}
                  onCheckedChange={() => toggleDiff(d)}
                  className="h-4 w-4 border-white/20 data-[state=checked]:bg-bpim-primary"
                />
                <Label
                  htmlFor={`diff-${d}`}
                  className="cursor-pointer text-xs font-medium leading-none md:text-sm"
                >
                  {d}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
