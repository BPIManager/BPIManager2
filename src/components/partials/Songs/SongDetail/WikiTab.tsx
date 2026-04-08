import { useState } from "react";
import { ThumbsUp, Pencil, Trash2, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { LoginRequiredTabContent } from "@/components/partials/LoginRequired/LoginRequiredTabContent";
import { ActionConfirmDialog } from "@/components/partials/Modal/Confirmation";
import { useUser } from "@/contexts/users/UserContext";
import {
  useSongNotes,
  type SongNote,
  type SongNoteSort,
} from "@/hooks/songs/useSongNotes";

interface WikiTabProps {
  songId: number;
}

export function WikiTab({ songId }: WikiTabProps) {
  const { fbUser } = useUser();
  const isLoggedIn = !!fbUser?.uid;

  const {
    notes,
    isLoading,
    sort,
    setSort,
    createNote,
    updateNote,
    deleteNote,
    toggleUpvote,
  } = useSongNotes(songId, fbUser ?? null);

  const [composeBody, setComposeBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleSubmit() {
    if (!composeBody.trim()) return;
    setSubmitting(true);
    try {
      await createNote(composeBody.trim());
      setComposeBody("");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(note: SongNote) {
    setEditingId(note.id);
    setEditBody(note.body);
  }

  async function handleEditSave(noteId: number) {
    if (!editBody.trim()) return;
    await updateNote(noteId, editBody.trim());
    setEditingId(null);
  }

  async function handleDeleteConfirm() {
    if (deletingId === null) return;
    await deleteNote(deletingId);
    setDeletingId(null);
  }

  return (
    <div className="flex flex-col gap-4 mt-2">
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
          active={sort === "bpi"}
          icon={<TrendingUp className="h-3 w-3" />}
          label="投稿者の総合BPIが高い順"
          onClick={() => setSort("bpi")}
        />
      </div>

      {isLoggedIn ? (
        <div className="rounded-xl border border-bpim-border bg-bpim-surface p-3 flex flex-col gap-2">
          <Textarea
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            placeholder="楽曲の攻略メモを投稿しましょう。当たり譜面の判別方法、ギアチェンのタイミングなどを自由に残すことができます。(最大2000文字)"
            maxLength={2000}
            rows={3}
            className="resize-none bg-bpim-bg border-bpim-border text-bpim-text text-sm placeholder:text-bpim-muted/50 focus-visible:ring-bpim-primary"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-bpim-muted">
              {composeBody.length}/2000
            </span>
            <Button
              size="sm"
              disabled={!composeBody.trim() || submitting}
              onClick={handleSubmit}
              className="h-7 rounded-full bg-bpim-primary text-bpim-bg font-bold text-xs hover:bg-bpim-primary/80 disabled:opacity-40"
            >
              投稿する
            </Button>
          </div>
        </div>
      ) : (
        <LoginRequiredTabContent feature="攻略メモ" />
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <p className="py-8 text-center text-sm text-bpim-muted">
          まだ攻略メモがありません
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isLoggedIn={isLoggedIn}
              isEditing={editingId === note.id}
              editBody={editBody}
              onEditBodyChange={setEditBody}
              onStartEdit={() => startEdit(note)}
              onEditSave={() => handleEditSave(note.id)}
              onEditCancel={() => setEditingId(null)}
              onDelete={() => setDeletingId(note.id)}
              onToggleUpvote={() => toggleUpvote(note.id, note.upvoted)}
            />
          ))}
        </div>
      )}
      <ActionConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="メモを削除"
        description="このメモを削除しますか？この操作は取り消せません。"
        confirmLabel="削除"
        isDestructive
      />
    </div>
  );
}

function SortButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
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

interface NoteCardProps {
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

function NoteCard({
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
        <p className="text-sm text-bpim-text whitespace-pre-wrap break-words">
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
