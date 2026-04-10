import { useState } from "react";
import { Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoginRequiredTabContent } from "@/components/partials/LoginRequired/LoginRequiredTabContent";
import { ActionConfirmDialog } from "@/components/partials/Modal/Confirmation";
import { useUser } from "@/contexts/users/UserContext";
import { useSongNotes, type SongNote } from "@/hooks/songs/useSongNotes";
import { NoteCard, SortButton } from "./ui";
import { WikiTabSkeleton } from "./skeleton";

interface WikiTabProps {
  songId: number;
}

export function WikiTab({ songId }: WikiTabProps) {
  const { fbUser } = useUser();
  const isLoggedIn = !!fbUser?.uid;

  const { notes, isLoading, sort, setSort, createNote, updateNote, deleteNote, toggleUpvote } =
    useSongNotes(songId, fbUser ?? null);

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
        <WikiTabSkeleton />
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
