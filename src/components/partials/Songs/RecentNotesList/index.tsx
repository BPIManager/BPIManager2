import { Clock, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useRecentNotes } from "@/hooks/songs/useRecentNotes";
import { DifficultyBadge } from "@/components/partials/Songs/DifficultyBadge";
import { SortButton, formatDate } from "@/components/partials/Songs/SongDetail/Wiki/ui";
import { InfiniteScrollContainer } from "@/components/partials/InfiniteScroll/ui";
import { Skeleton } from "@/components/ui/skeleton";
import type { RecentNote } from "@/hooks/songs/useRecentNotes";

function RecentNoteCard({ note }: { note: RecentNote }) {
  const bpiLabel =
    note.authorTotalBpi !== null
      ? `BPI ${note.authorTotalBpi.toFixed(2)}`
      : "BPI ---";

  return (
    <div className="mb-2 rounded-xl border border-bpim-border bg-bpim-surface p-3 flex flex-col gap-2">
      <Link
        href={`/songs/${note.songId}/notes`}
        className="flex items-center gap-2 flex-wrap hover:opacity-80 transition-opacity"
      >
        <DifficultyBadge difficulty={note.difficulty} level={note.difficultyLevel} />
        <span className="text-sm font-bold text-bpim-text truncate">{note.songTitle}</span>
      </Link>

      <p className="text-sm text-bpim-text whitespace-pre-wrap wrap-break-word line-clamp-3">
        {note.body}
      </p>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-bpim-border/50">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-bpim-overlay px-2 py-0.5 text-[10px] font-mono font-bold text-bpim-muted">
            {bpiLabel}
          </span>
          <span className="text-[10px] text-bpim-muted/50">
            {formatDate(note.createdAt)}
          </span>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-bold text-bpim-muted">
          <ThumbsUp className="h-3 w-3" />
          {note.upvoteCount}
        </span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[110px] w-full rounded-xl" />
      ))}
    </div>
  );
}

export function RecentNotesList() {
  const { notes, isLoading, isLoadingMore, isReachingEnd, setSize, sort, setSort } =
    useRecentNotes();

  const header = (
    <div className="p-3 flex flex-col gap-2 border-b border-bpim-border">
      <h2 className="text-sm font-bold text-bpim-text">最新の攻略メモ</h2>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-bpim-muted uppercase tracking-widest">
          並び替え
        </span>
        <SortButton
          active={sort === "latest"}
          icon={<Clock className="h-3 w-3" />}
          label="最新順"
          onClick={() => setSort("latest")}
        />
        <SortButton
          active={sort === "upvotes"}
          icon={<ThumbsUp className="h-3 w-3" />}
          label="GOODが多い順"
          onClick={() => setSort("upvotes")}
        />
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-surface overflow-hidden">
      {isLoading ? (
        <>
          <div className="p-3 flex flex-col gap-2 border-b border-bpim-border">
            <h2 className="text-sm font-bold text-bpim-text">最新の攻略メモ</h2>
          </div>
          <LoadingSkeleton />
        </>
      ) : (
        <InfiniteScrollContainer
          items={notes}
          renderItem={(note) => <RecentNoteCard key={note.id} note={note} />}
          isLoadingMore={isLoadingMore}
          isReachingEnd={isReachingEnd}
          setSize={setSize}
          maxH="calc(100vh - 220px)"
          emptyMessage="まだ攻略メモがありません"
          header={header}
          className="p-2"
        />
      )}
    </div>
  );
}
