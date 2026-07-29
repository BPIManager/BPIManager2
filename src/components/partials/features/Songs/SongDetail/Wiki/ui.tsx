import { ThumbsUp, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SongNote } from "@/hooks/songs/useSongNotes";

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

interface SortButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export function SortButton({ active, icon, label, onClick }: SortButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
        active
          ? "bg-bpim-primary text-bpim-bg"
          : "bg-bpim-overlay text-bpim-muted hover:text-bpim-text"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export interface NoteCardProps {
  note: SongNote;
  isLoggedIn: boolean;
  isEditing: boolean;
  editBody: string;
  onEditBodyChange: (v: string) => void;
  onStartEdit: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDelete: () => void;
  onToggleUpvote: () => void;
}

export function NoteCard({
  note,
  isLoggedIn,
  isEditing,
  editBody,
  onEditBodyChange,
  onStartEdit,
  onEditSave,
  onEditCancel,
  onDelete,
  onToggleUpvote,
}: NoteCardProps) {
  const bpiLabel =
    note.authorTotalBpi !== null
      ? `BPI ${note.authorTotalBpi.toFixed(2)}`
      : "BPI ---";

  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-surface p-3 flex flex-col gap-2">
      {isEditing ? (
        <>
          <Textarea
            value={editBody}
            onChange={(e) => onEditBodyChange(e.target.value)}
            rows={4}
            maxLength={2000}
            className="resize-none bg-bpim-bg border-bpim-border text-bpim-text text-sm focus-visible:ring-bpim-primary"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-bpim-muted">
              {editBody.length}/2000
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={onEditCancel}
                className="h-6 text-xs text-bpim-muted"
              >
                キャンセル
              </Button>
              <Button
                size="sm"
                disabled={!editBody.trim()}
                onClick={onEditSave}
                className="h-6 rounded-full bg-bpim-primary text-bpim-bg font-bold text-xs hover:bg-bpim-primary/80"
              >
                保存
              </Button>
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-bpim-text whitespace-pre-wrap wrap-break-word">
          {note.body}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-bpim-border/50">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-bpim-overlay px-2 py-0.5 text-[10px] font-mono font-bold text-bpim-muted">
            {bpiLabel}
          </span>
          <span className="text-[10px] text-bpim-muted/50">
            {formatDate(note.updatedAt)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={isLoggedIn ? onToggleUpvote : undefined}
            disabled={!isLoggedIn}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors ${
              note.upvoted
                ? "bg-bpim-primary/20 text-bpim-primary"
                : "text-bpim-muted hover:text-bpim-text disabled:opacity-40"
            }`}
          >
            <ThumbsUp className="h-3 w-3" />
            <span>{note.upvoteCount}</span>
          </button>

          {note.editable && !isEditing && (
            <>
              <button
                onClick={onStartEdit}
                className="rounded p-1 text-bpim-muted hover:text-bpim-text transition-colors"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={onDelete}
                className="rounded p-1 text-bpim-muted hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

