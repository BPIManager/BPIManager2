import useSWR from "swr";
import { useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { fetcher } from "@/utils/common/fetch";

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

async function authFetch(
  url: string,
  method: string,
  fbUser: FirebaseUser | null,
  body?: unknown,
): Promise<Response> {
  const token = fbUser ? await fbUser.getIdToken() : null;
  return fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function useSongNotes(songId: number, fbUser: FirebaseUser | null) {
  const [sort, setSort] = useState<SongNoteSort>("latest");

  const url = `${API_PREFIX}/songs/${songId}/notes?sort=${sort}`;
  const swrKey: [string, FirebaseUser | null] = [url, fbUser];

  const { data, isLoading, mutate } = useSWR<SongNote[]>(
    swrKey,
    () => fetcher([url, fbUser]),
    { revalidateOnFocus: false },
  );

  async function createNote(body: string): Promise<void> {
    await authFetch(`${API_PREFIX}/songs/${songId}/notes`, "POST", fbUser, {
      body,
    });
    await mutate();
  }

  async function updateNote(noteId: number, body: string): Promise<void> {
    await authFetch(
      `${API_PREFIX}/songs/${songId}/notes/${noteId}`,
      "PATCH",
      fbUser,
      { body },
    );
    await mutate();
  }

  async function deleteNote(noteId: number): Promise<void> {
    await authFetch(
      `${API_PREFIX}/songs/${songId}/notes/${noteId}`,
      "DELETE",
      fbUser,
    );
    await mutate();
  }

  async function toggleUpvote(
    noteId: number,
    currentlyUpvoted: boolean,
  ): Promise<void> {
    const method = currentlyUpvoted ? "DELETE" : "POST";
    const res = await authFetch(
      `${API_PREFIX}/songs/${songId}/notes/${noteId}/upvote`,
      method,
      fbUser,
    );
    if (!res.ok) return;
    const { upvoteCount } = await res.json();
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
