import { FilterParamsFrontend, SongWithScore } from "@/types/songs/withScore";
import { getMaxBpm } from "./getMaxBPM";

type SongForSort = SongWithScore & {
  logId?: number | null;
  rival?: {
    exScore: number | null;
    bpi: number | null;
    lastPlayed: Date | string | null;
  } | null;
  lastPlayedMax?: Date | string | null;
};

export const sortSongs = (
  songs: SongWithScore[],
  p: FilterParamsFrontend,
): SongWithScore[] => {
  const { sortKey = "level", sortOrder = "desc", search } = p;
  const isAsc = sortOrder === "asc";

  const getRate = (ex: number | null | undefined, notes: number) => {
    if (ex === null || ex === undefined || !notes) return -1;
    return ex / (notes * 2);
  };

  const getWinStatus = (s: SongForSort) => {
    const myRate = getRate(s.exScore, s.notes);
    const rivalRate = getRate(s.rival?.exScore, s.notes);
    if (myRate === -1 || rivalRate === -1) return 0;
    if (myRate > rivalRate) return 1;
    if (myRate < rivalRate) return -1;
    return 0;
  };

  return [...songs].sort((a: SongForSort, b: SongForSort) => {
    if (search) {
      const searchLower = search.toLowerCase();
      const getWeight = (t: string) =>
        t.toLowerCase() === searchLower
          ? 0
          : t.toLowerCase().startsWith(searchLower)
            ? 1
            : 2;
      const diff = getWeight(a.title) - getWeight(b.title);
      if (diff !== 0) return diff;
    }

    let vA: any, vB: any;

    switch (sortKey) {
      case "rivalBpi":
        vA = a.rival?.bpi ?? -15;
        vB = b.rival?.bpi ?? -15;
        break;
      case "myBpi":
        vA = a.bpi ?? -15;
        vB = b.bpi ?? -15;
        break;
      case "rivalRate":
        vA = getRate(a.rival?.exScore, a.notes);
        vB = getRate(b.rival?.exScore, b.notes);
        break;
      case "myRate":
        vA = getRate(a.exScore, a.notes);
        vB = getRate(b.exScore, b.notes);
        break;

      case "winGapAsc":
      case "winGapDesc": {
        const statusA = getWinStatus(a);
        const statusB = getWinStatus(b);
        if (statusA !== statusB) return statusB - statusA;
        const gapA = Math.abs(
          getRate(a.exScore, a.notes) - getRate(a.rival?.exScore, a.notes),
        );
        const gapB = Math.abs(
          getRate(b.exScore, b.notes) - getRate(b.rival?.exScore, b.notes),
        );
        const res = sortKey === "winGapAsc" ? gapA - gapB : gapB - gapA;
        if (res !== 0) return res;
        break;
      }

      case "loseGapAsc":
      case "loseGapDesc": {
        const statusA = getWinStatus(a);
        const statusB = getWinStatus(b);
        if (statusA !== statusB) return statusA - statusB;
        const gapA = Math.abs(
          getRate(a.exScore, a.notes) - getRate(a.rival?.exScore, a.notes),
        );
        const gapB = Math.abs(
          getRate(b.exScore, b.notes) - getRate(b.rival?.exScore, b.notes),
        );
        const res = sortKey === "loseGapAsc" ? gapA - gapB : gapB - gapA;
        if (res !== 0) return res;
        break;
      }

      case "rivalUpdated":
        vA = a.rival?.lastPlayed ? new Date(a.rival.lastPlayed).getTime() : 0;
        vB = b.rival?.lastPlayed ? new Date(b.rival.lastPlayed).getTime() : 0;
        break;
      case "myUpdated":
        vA = a.scoreAt ? new Date(a.scoreAt).getTime() : 0;
        vB = b.scoreAt ? new Date(b.scoreAt).getTime() : 0;
        break;
      case "updatedAt":
        vA = new Date(a.lastPlayedMax || a.scoreAt || 0).getTime();
        vB = new Date(b.lastPlayedMax || b.scoreAt || 0).getTime();
        break;

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
      default:
        vA = a.difficultyLevel;
        vB = b.difficultyLevel;
    }

    if (vA < vB) return isAsc ? -1 : 1;
    if (vA > vB) return isAsc ? 1 : -1;

    if (a.difficultyLevel !== b.difficultyLevel) {
      return b.difficultyLevel - a.difficultyLevel;
    }
    return a.title.localeCompare(b.title);
  });
};
