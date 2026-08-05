import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { versionsNonDisabledCollection } from "@/constants/iidx/versionTitles";
import { A_RANKS } from "@/constants/iidx/arenaRanks";
import { useTranslation } from "@/hooks/common/useTranslation";

const AnalysisControls = ({
  version,
  onVersionChange,
  rank,
  onRankChange,
  level,
  onLevelChange,
}: {
  version: string;
  onVersionChange: (v: string) => void;
  rank: string;
  onRankChange: (r: string) => void;
  level: string;
  onLevelChange: (l: string) => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-bg/80 p-4 shadow-sm backdrop-blur-md">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black tracking-widest text-bpim-muted uppercase px-1">
            Version
          </span>
          <Select value={version} onValueChange={onVersionChange}>
            <SelectTrigger className="h-9 border-bpim-border bg-bpim-surface-2/60 text-xs text-bpim-text focus:ring-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-bpim-border bg-bpim-bg">
              {versionsNonDisabledCollection.map((v) => (
                <SelectItem key={v.value} value={v.value} className="text-xs">
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black tracking-widest text-bpim-muted uppercase px-1">
            {t("page.arenaAverage.rank")}
          </span>
          <Select value={rank} onValueChange={onRankChange}>
            <SelectTrigger className="h-9 border-bpim-border bg-bpim-surface-2/60 text-sm font-bold text-bpim-text">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-bpim-border bg-bpim-bg">
              {A_RANKS.map((r) => (
                <SelectItem key={r} value={r} className="text-sm font-bold">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black tracking-widest text-bpim-muted uppercase px-1">
            Level
          </span>
          <RadioGroup
            value={level}
            onValueChange={onLevelChange}
            className="flex h-9 items-center gap-8"
          >
            {["11", "12"].map((lv) => (
              <div key={lv} className="flex items-center gap-2">
                <RadioGroupItem
                  value={lv}
                  id={`analysis-lv-${lv}`}
                  className="border-bpim-primary"
                />
                <Label
                  htmlFor={`analysis-lv-${lv}`}
                  className="cursor-pointer text-sm font-bold text-bpim-text"
                >
                  ☆{lv}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );
};

export default AnalysisControls;
