import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { versionsNonDisabledCollection } from "@/constants/versions";

interface RankingVersionSelectorProps {
  version: string;
  onChange: (v: string) => void;
}

export function RankingVersionSelector({
  version,
  onChange,
}: RankingVersionSelectorProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-[10px] font-bold text-bpim-muted uppercase tracking-widest">
        Version
      </span>
      <Select value={version} onValueChange={onChange}>
        <SelectTrigger className="h-7 w-36 border-bpim-border bg-bpim-bg text-bpim-text text-xs">
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
  );
}

interface RankingSelfRankCardProps {
  selfRank: number;
  totalCount: number;
}

export function RankingSelfRankCard({
  selfRank,
  totalCount,
}: RankingSelfRankCardProps) {
  return (
    <div className="rounded-xl border border-bpim-muted/20 bg-bpim-overlay/40 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-bpim-muted">全 {totalCount} 人中</p>
        <div className="text-right">
          <span className="text-xs text-bpim-muted">あなたの順位</span>
          <div className="font-mono text-lg font-bold text-bpim-text">
            <span className="text-bpim-primary">{selfRank}</span>
            <span className="ml-0.5 text-xs">位</span>
          </div>
        </div>
      </div>
    </div>
  );
}
