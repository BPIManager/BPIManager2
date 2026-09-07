import useSWR from "swr";
import { useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { fetcherV2, unwrapApiResponse } from "@/services/swr/fetchV2";

export interface SongNote {
  id: number;
  body: string;
  authorTotalBpi: number | null;
  upvoteCount: number;
  upvoted: boolean;
  editable: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SongNoteSort = "latest" | "bpi";

export function useSongNotes(songId: number, fbUser: FirebaseUser | null) {
  const [sort, setSort] = useState<SongNoteSort>("latest");

  const url = `${API_V2_PREFIX}/songs/${songId}/notes?sort=${sort}`;
  // キャッシュキーにはFirebase Userオブジェクト全体でなくuidのみを使う
  const swrKey: [string, string | null] = [url, fbUser?.uid ?? null];

  const { data, isLoading, mutate } = useSWR<SongNote[]>(
    swrKey,
    () => fetcherV2([url, fbUser]),
    { revalidateOnFocus: false },
  );

  async function createNote(body: string): Promise<void> {
    const res = await authFetch(
      `${API_V2_PREFIX}/songs/${songId}/notes`,
      "POST",
      fbUser,
      { body },
    );
    if (!res.ok) throw new Error("Failed to create note");
    await mutate();
  }

  async function updateNote(noteId: number, body: string): Promise<void> {
    const res = await authFetch(
      `${API_V2_PREFIX}/songs/${songId}/notes/${noteId}`,
      "PATCH",
      fbUser,
      { body },
    );
    if (!res.ok) throw new Error("Failed to update note");
    await mutate();
  }

  async function deleteNote(noteId: number): Promise<void> {
    const res = await authFetch(
      `${API_V2_PREFIX}/songs/${songId}/notes/${noteId}`,
      "DELETE",
      fbUser,
    );
    if (!res.ok) throw new Error("Failed to delete note");
    await mutate();
  }

  async function toggleUpvote(
    noteId: number,
    currentlyUpvoted: boolean,
  ): Promise<void> {
    const method = currentlyUpvoted ? "DELETE" : "POST";
    const res = await authFetch(
      `${API_V2_PREFIX}/songs/${songId}/notes/${noteId}/upvote`,
      method,
      fbUser,
    );
    if (!res.ok) return;
    const { upvoteCount } = await unwrapApiResponse<{ upvoteCount: number }>(
      res,
    );
    await mutate(
      (prev) =>
        prev?.map((n) =>
          n.id === noteId
            ? { ...n, upvoted: !currentlyUpvoted, upvoteCount }
            : n,
        ),
      { revalidate: false },
    );
  }

  return {
    notes: data ?? [],
    isLoading,
    sort,
    setSort,
    createNote,
    updateNote,
    deleteNote,
    toggleUpvote,
  };
}
