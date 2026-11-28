import dayjs from "@/lib/dayjs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Crown, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import type { Score } from "@/types/db";
import { getDJRank } from "@/utils/songs/djRank";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { USE_OPTION_CHOICES } from "@/schemas/scores/useOption";

/** 使用オプションが未設定のときの、選択肢の値 */
const UNSET = "unset";

/** 使用オプション。選べるとき（自分の記録）は選択、そうでなければ値があるときだけ出す（#708） */
const UseOptionField = ({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange?: (v: string | null) => void;
}) => {
  if (!onChange)
    return value ? (
      <span className="font-mono text-[10px] font-bold text-bpim-muted">
        {value}
      </span>
    ) : null;
  // 読み取った値が選択肢に無い（DP の組など）ときは、その値も選べるようにする
  const choices: readonly string[] =
    value && !USE_OPTION_CHOICES.includes(value as never)
      ? [...USE_OPTION_CHOICES, value]
      : USE_OPTION_CHOICES;
  return (
    <Select
      value={value ?? UNSET}
      onValueChange={(v) => onChange(v === UNSET ? null : v)}
    >
      <SelectTrigger
        aria-label="使用オプション"
        className="h-5 w-24 px-1.5 py-0 text-[10px] font-bold"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNSET} className="text-xs text-bpim-muted">
          オプション未設定
        </SelectItem>
        {choices.map((c) => (
          <SelectItem key={c} value={c} className="text-xs">
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const djRankText = (
  mode: "current" | "next",
  exScore: number,
  maxScore: number,
) =>
  `${getDJRank(exScore, maxScore, { mode, output: "label" })}${getDJRank(exScore, maxScore, { mode, output: "value" })}`;

const HistoryRecordCard = ({
  record,
  scoreDiff,
  isGlobalBest,
  notes,
  maxScore,
  onUseOptionChange,
}: {
  record: Score;
  /** 渡されたとき（自分の記録）だけ、使用オプションを選べる。選んだら呼ぶ */
  onUseOptionChange?: (useOption: string | null) => void;
  scoreDiff: number | null;
  isGlobalBest: boolean;
  /** 理論値(notes*2)。渡された場合のみDJランク表記(例: AAA+12 / MAX-34)を出す */
  maxScore?: number;
  /** 全難易度スコア(BPI未計算)の場合に渡す。渡された場合はBPIの代わりにnotes基準の%を表示する */
  notes?: number;
}) => {
  const scoreColor = isGlobalBest ? "text-bpim-warning" : "text-bpim-text";

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 rounded-lg border-l-3 bg-bpim-surface-2/60 p-3 transition-colors hover:bg-bpim-overlay",
        isGlobalBest
          ? "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
          : "border-bpim-border",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-bpim-muted">
          <Calendar className="h-3 w-3" />
          <span className="font-mono text-[10px] font-bold">
            {dayjs(record.lastPlayed).tz().format("YYYY/MM/DD HH:mm")}
          </span>
          <UseOptionField
            value={record.useOption}
            onChange={onUseOptionChange}
          />
        </div>
        <div className="flex items-center gap-2">
          {scoreDiff !== null && scoreDiff > 0 && (
            <Badge
              variant="secondary"
              className="h-4 bg-green-500/10 text-bpim-success border-green-500/20 px-1.5 text-[9px] font-bold"
            >
              <TrendingUp className="mr-0.5 h-2.5 w-2.5" />+{scoreDiff}
            </Badge>
          )}
          {isGlobalBest && (
            <Badge className="h-4 bg-bpim-warning px-1.5 text-[9px] font-black border-none">
              <Crown className="mr-0.5 h-2.5 w-2.5" />
              BEST
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-0">
          <span
            className={cn(
              "font-mono text-lg font-black leading-none tracking-tighter",
              scoreColor,
            )}
          >
            {record.exScore}
          </span>
          {notes != null ? (
            <span className="font-mono text-[10px] font-bold text-bpim-muted mt-0.5">
              {((record.exScore / (notes * 2)) * 100).toFixed(1)}%{"  "}
              {record.clearState || "NO PLAY"}
            </span>
          ) : (
            <span className="font-mono text-[10px] font-bold text-bpim-muted">
              BPI: {(record.bpi || -15).toFixed(2)}
            </span>
          )}
          {maxScore != null && maxScore > 0 && (
            <span className="font-mono text-[10px] font-bold text-bpim-muted">
              {djRankText("current", record.exScore, maxScore)} /{" "}
              {djRankText("next", record.exScore, maxScore)}
            </span>
          )}
        </div>

        <div className="flex flex-col items-end gap-0.5">
          {notes != null ? (
            record.missCount !== null && (
              <div className="flex items-center gap-1">
                <AlertCircle className="h-2.5 w-2.5 text-bpim-danger" />
                <span
                  className={cn(
                    "font-mono text-xs font-bold",
                    record.missCount === 0
                      ? "text-bpim-success"
                      : "text-bpim-danger",
                  )}
                >
                  MISS: {record.missCount}
                </span>
              </div>
            )
          ) : (
            <>
              <span className="text-[10px] font-black uppercase text-bpim-text">
                {record.clearState || "NO PLAY"}
              </span>
              {record.missCount !== null && (
                <span className="font-mono text-[9px] font-bold text-bpim-danger/80">
                  MISS: {record.missCount}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryRecordCard;
