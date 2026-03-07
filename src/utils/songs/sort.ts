import { SongWithScore } from "@/types/songs/withScore";
import { getMaxBpm } from "./getMaxBPM";
import { FilterParams } from "./filter";

export const sortSongs = (
  songs: SongWithScore[],
  p: FilterParams,
): SongWithScore[] => {
  const { sortKey = "level", sortOrder = "desc", search } = p;
  const isAsc = sortOrder === "asc";

  return [...songs].sort((a, b) => {
    if (search) {
      const aFull =
        a.title.toLowerCase() === search.toLowerCase()
          ? 0
          : a.title.toLowerCase().startsWith(search.toLowerCase())
            ? 1
            : 2;
      const bFull =
        b.title.toLowerCase() === search.toLowerCase()
          ? 0
          : b.title.toLowerCase().startsWith(search.toLowerCase())
            ? 1
            : 2;
      if (aFull !== bFull) return aFull - bFull;
    }

    let vA: any, vB: any;
    switch (sortKey) {
      case "bpi":
        vA = a.bpi ?? -15;
        vB = b.bpi ?? -15;
        break;
      case "bpm":
        vA = getMaxBpm(a.bpm);
        vB = getMaxBpm(b.bpm);
        break;
      case "notes":
        vA = a.notes;
        vB = b.notes;
        break;
      case "title":
        vA = a.title;
        vB = b.title;
        break;
      case "version":
        vA = a.releasedVersion ?? 0;
        vB = b.releasedVersion ?? 0;
        break;
      case "updatedAt":
        vA = a.scoreAt ? new Date(a.scoreAt).getTime() : 0;
        vB = b.scoreAt ? new Date(b.scoreAt).getTime() : 0;
        break;
      default:
        vA = a.difficultyLevel;
        vB = b.difficultyLevel;
    }

    if (vA < vB) return isAsc ? -1 : 1;
    if (vA > vB) return isAsc ? 1 : -1;
    return 0;
  });
};
