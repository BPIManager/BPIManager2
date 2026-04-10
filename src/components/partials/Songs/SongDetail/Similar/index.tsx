import { useSimilarSongs } from "@/hooks/songs/useSimilarSongs";
import { SimilarSongRow } from "./ui";
import { SimilarTabSkeleton } from "./skeleton";

interface SimilarTabProps {
  songId: number;
  version: string;
}

export function SimilarTab({ songId, version }: SimilarTabProps) {
  const { similar, isLoading } = useSimilarSongs(songId, version, 15, "global");

  if (isLoading) return <SimilarTabSkeleton />;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {similar.length === 0 ? (
        <p className="py-8 text-center text-sm text-bpim-muted">
          類似楽曲データが見つかりませんでした
        </p>
      ) : (
        similar.map((s) => <SimilarSongRow key={s.songId} song={s} />)
      )}
    </div>
  );
}
