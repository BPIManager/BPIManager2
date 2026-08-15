import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IIDX_LEVELS, IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import {
  type RivalSortOrder,
  RIVAL_SORT_LABELS,
} from "@/hooks/social/useRivalListFilter";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { FollowListSummary } from "@/types/users/followList";

interface RivalFilterProps {
  levels: string[];
  difficulties: string[];
  sortOrder: RivalSortOrder;
  onToggleLevel: (lv: string) => void;
  onToggleDifficulty: (diff: string) => void;
  onChangeSortOrder: (order: RivalSortOrder) => void;
  lists?: FollowListSummary[];
  listId?: number | null;
  onChangeListId?: (listId: number | null) => void;
}

const RivalFilter = ({
  levels,
  difficulties,
  sortOrder,
  onToggleLevel,
  onToggleDifficulty,
  onChangeSortOrder,
  lists,
  listId,
  onChangeListId,
}: RivalFilterProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg/40 p-4 lg:flex-row lg:items-start lg:gap-10">
      {lists && lists.length > 0 && onChangeListId && (
        <div className="flex flex-col gap-2.5">
          <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
            List
          </span>
          <Select
            value={listId != null ? String(listId) : "all"}
            onValueChange={(v) => onChangeListId(v === "all" ? null : Number(v))}
          >
            <SelectTrigger
              size="sm"
              className="h-8 min-w-32 border-bpim-border bg-bpim-bg/20 text-xs text-bpim-text"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-bpim-border bg-bpim-bg">
              <SelectItem value="all" className="text-xs">
                {t("rivals.list.filterAll")}
              </SelectItem>
              {lists.map((list) => (
                <SelectItem key={list.id} value={String(list.id)} className="text-xs">
                  {list.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
          Level
        </span>
        <div className="flex flex-wrap gap-4">
          {IIDX_LEVELS.map((l) => (
            <div key={l} className="flex items-center gap-2">
              <Checkbox
                id={`lv-${l}`}
                checked={levels.includes(l)}
                onCheckedChange={() => onToggleLevel(l)}
                className="h-4 w-4 border-bpim-border data-[state=checked]:bg-bpim-primary"
              />
              <Label
                htmlFor={`lv-${l}`}
                className="text-xs font-bold text-bpim-text cursor-pointer"
              >
                ☆{l}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
          Difficulty
        </span>
        <div className="flex flex-wrap gap-4">
          {IIDX_DIFFICULTIES.map((d) => (
            <div key={d} className="flex items-center gap-2">
              <Checkbox
                id={`diff-${d}`}
                checked={difficulties.includes(d)}
                onCheckedChange={() => onToggleDifficulty(d)}
                className="h-4 w-4 border-bpim-border data-[state=checked]:bg-bpim-primary"
              />
              <Label
                htmlFor={`diff-${d}`}
                className="text-xs font-bold text-bpim-text cursor-pointer uppercase"
              >
                {d}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
          Sort
        </span>
        <div className="flex flex-wrap gap-4">
          {(Object.keys(RIVAL_SORT_LABELS) as RivalSortOrder[]).map((key) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="radio"
                id={`sort-${key}`}
                name="rivalSort"
                checked={sortOrder === key}
                onChange={() => onChangeSortOrder(key)}
                className="accent-bpim-primary"
              />
              <Label
                htmlFor={`sort-${key}`}
                className="text-xs font-bold text-bpim-text cursor-pointer"
              >
                {t(RIVAL_SORT_LABELS[key])}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RivalFilter;
