import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DIFFICULTY_OPTIONS, SORT_OPTIONS } from "@/utils/songs/songListFilter";
import { SortIcon } from "./SortIcon";
import type { SortKey, SortDir } from "@/types/songs/songList";

interface SongFilterControlsProps {
  localSearch: string;
  onSearchChange: (v: string) => void;
  difficulties: Set<string>;
  onToggleDifficulty: (diff: string) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSortClick: (key: SortKey) => void;
}

export function SongFilterControls({
  localSearch,
  onSearchChange,
  difficulties,
  onToggleDifficulty,
  sortKey,
  sortDir,
  onSortClick,
}: SongFilterControlsProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-bpim-border bg-bpim-surface p-4">
      <Input
        placeholder="楽曲名で検索..."
        value={localSearch}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-8 border-bpim-border bg-bpim-bg text-bpim-text text-xs placeholder:text-bpim-muted"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase w-20 shrink-0">
          Difficulty
        </span>
        <div className="flex h-8 items-center flex-wrap gap-x-4 gap-y-2">
          {DIFFICULTY_OPTIONS.map((diff) => (
            <div key={diff} className="flex items-center gap-2">
              <Checkbox
                id={`diff-${diff}`}
                checked={difficulties.has(diff)}
                onCheckedChange={() => onToggleDifficulty(diff)}
                className="h-4 w-4 border-bpim-border data-[state=checked]:bg-bpim-primary"
              />
              <Label
                htmlFor={`diff-${diff}`}
                className="cursor-pointer text-xs font-bold leading-none text-bpim-text"
              >
                {diff.slice(0, 1)}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase w-20 shrink-0">
          Sort
        </span>
        <div className="flex flex-wrap gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortClick(opt.value)}
              className={`flex items-center gap-0.5 rounded px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                sortKey === opt.value
                  ? "bg-bpim-primary/20 text-bpim-primary border-bpim-primary/40"
                  : "bg-bpim-overlay text-bpim-muted border-bpim-border hover:border-bpim-primary/30"
              }`}
            >
              {opt.label}
              <SortIcon
                sortKey={opt.value}
                currentKey={sortKey}
                dir={sortDir}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
