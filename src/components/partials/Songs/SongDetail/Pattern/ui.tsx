import { useEffect } from "react";
import { ExternalLink, ThumbsDown, ThumbsUp } from "lucide-react";
import type { RowComponentProps } from "react-window";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { SongPatternItem } from "@/hooks/songs/useSongPatterns";
import type { SongListItem } from "@/types/songs/songInfo";
import type { VoteType } from "@/types/db";
import {
  buildTextageUrl,
  getPatternBadge,
  type PatternBadge,
} from "@/utils/songs/patternUtils";

const BADGE_CLASS: Record<NonNullable<PatternBadge>, string> = {
  normal: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  mirror: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  "r-ran": "bg-orange-500/20 text-orange-400 border-orange-500/30",
};
const BADGE_LABEL: Record<NonNullable<PatternBadge>, string> = {
  normal: "正規",
  mirror: "ミラー",
  "r-ran": "R-RAN",
};

export function PatternBadgeLabel({ badge }: { badge: PatternBadge }) {
  if (!badge) return null;
  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 ${BADGE_CLASS[badge]}`}
    >
      {BADGE_LABEL[badge]}
    </Badge>
  );
}

export const PATTERN_ROW_HEIGHT = 48;

export interface PatternRowProps {
  items: SongPatternItem[];
  song: SongListItem;
  onVote: (pattern: string, voteType: VoteType) => void;
  onDeleteVote: (pattern: string) => void;
  isLoggedIn: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

function PatternSentinelRow({ style, onLoadMore }: { style: React.CSSProperties; onLoadMore: () => void }) {
  useEffect(() => {
    onLoadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div style={style} className="flex items-center justify-center text-xs text-bpim-muted">
      読み込み中...
    </div>
  );
}

export function PatternListRow({
  index,
  style,
  items,
  song,
  onVote,
  onDeleteVote,
  isLoggedIn,
  hasMore,
  onLoadMore,
}: RowComponentProps<PatternRowProps>) {
  if (hasMore && index === items.length) {
    return <PatternSentinelRow style={style} onLoadMore={onLoadMore} />;
  }

  const item = items[index];
  if (!item) return null;

  const badge = getPatternBadge(item.pattern);
  const url1p = buildTextageUrl(song, 1, item.pattern);
  const url2p = buildTextageUrl(song, 2, item.pattern.split("").reverse().join(""));

  function handleVote(voteType: VoteType) {
    if (item.myVote === voteType) {
      onDeleteVote(item.pattern);
    } else {
      onVote(item.pattern, voteType);
    }
  }

  return (
    <div
      style={style}
      className="flex items-center gap-2 px-3 border-b border-bpim-border text-xs"
    >
      <span className="w-7 shrink-0 text-right text-bpim-muted tabular-nums">
        {index + 1}
      </span>

      <span className="font-mono font-semibold tracking-widest w-14.5 shrink-0">
        {item.pattern}
      </span>

      <div className="w-13.5 shrink-0">
        <PatternBadgeLabel badge={badge} />
      </div>

      <span className="flex-1 text-right tabular-nums text-bpim-muted">
        {item.score.toFixed(2)}
      </span>

      <div className="flex items-center gap-1 shrink-0">
        <button
          disabled={!isLoggedIn}
          onClick={() => handleVote("upvote")}
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors ${
            item.myVote === "upvote"
              ? "text-emerald-400"
              : "text-bpim-muted hover:text-bpim-text"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <ThumbsUp className="h-3 w-3" />
          <span className="tabular-nums">{item.upvoteCount}</span>
        </button>
        <button
          disabled={!isLoggedIn}
          onClick={() => handleVote("downvote")}
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors ${
            item.myVote === "downvote"
              ? "text-rose-400"
              : "text-bpim-muted hover:text-bpim-text"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <ThumbsDown className="h-3 w-3" />
          <span className="tabular-nums">{item.downvoteCount}</span>
        </button>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {url1p && (
          <a
            href={url1p}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-bpim-border text-bpim-muted hover:text-bpim-text hover:border-bpim-text transition-colors"
          >
            1P
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
        {url2p && (
          <a
            href={url2p}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-bpim-border text-bpim-muted hover:text-bpim-text hover:border-bpim-text transition-colors"
          >
            2P
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export function PatternTableHeader() {
  return (
    <div className="flex items-center gap-2 px-3 text-[10px] text-bpim-muted uppercase tracking-wide border-b border-bpim-border bg-bpim-surface-2 py-2">
      <span className="w-7 shrink-0 text-right">#</span>
      <span className="w-14.5 shrink-0">配置(1P基準)</span>
      <span className="w-13.5 shrink-0">種別</span>
      <span className="flex-1 text-right">スコア</span>
      <span className="w-22 shrink-0 text-center">投票</span>
      <span className="w-17 shrink-0 text-center">TEXTAGE</span>
    </div>
  );
}

export interface PatternSearchResult {
  score: number | null;
  rank: number | null;
  total: number | null;
}

interface PatternSearchBarProps {
  value: string;
  onChange: (v: string) => void;
  result: PatternSearchResult;
}

export function PatternSearchBar({
  value,
  onChange,
  result,
}: PatternSearchBarProps) {
  const badge = value.length === 7 ? getPatternBadge(value) : null;
  const isReady = value.length === 7;

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-bpim-border bg-bpim-surface">
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) =>
            onChange(e.target.value.replace(/[^1-7]/g, "").slice(0, 7))
          }
          placeholder="配置を入力 (例: 2345671)"
          className="font-mono tracking-widest h-8 text-sm"
          maxLength={7}
        />
        {isReady && <PatternBadgeLabel badge={badge} />}
      </div>
      {isReady && (
        <p className="text-xs text-bpim-muted">
          {result.score !== null ? (
            <>
              スコア:{" "}
              <span className="text-bpim-text font-semibold tabular-nums">
                {result.score.toFixed(2)}
              </span>
              　順位:{" "}
              <span className="text-bpim-text font-semibold tabular-nums">
                {result.rank}位
              </span>
              　/ {result.total}件中
            </>
          ) : (
            "このパターンはリストにありません"
          )}
        </p>
      )}
    </div>
  );
}
