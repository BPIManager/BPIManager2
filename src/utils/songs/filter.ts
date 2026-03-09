import {
  Difficulties,
  FilterParamsFrontend,
  SongWithScore,
} from "@/types/songs/withScore";
import { getMaxBpm } from "./getMaxBPM";
import dayjs from "@/lib/dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

export interface FilterParams {
  difficulty?: string;
  level?: number;
  clearState?: string;
  bpiMin?: number;
  bpiMax?: number;
  version?: string;
  bpmMin?: number;
  bpmMax?: number;
  isSofran?: boolean;
  notesMin?: number;
  notesMax?: number;
  search?: string;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
}

export const filterSongsServerSide = (
  songs: SongWithScore[],
  p: FilterParams,
): SongWithScore[] => {
  return songs.filter((s) => {
    if (p.clearState && s.clearState !== p.clearState) return false;

    if (p.bpiMin !== undefined && (s.bpi ?? -15) < Number(p.bpiMin))
      return false;
    if (p.bpiMax !== undefined && (s.bpi ?? -15) > Number(p.bpiMax))
      return false;

    if (p.version && s.releasedVersion !== Number(p.version)) return false;

    const maxBpm = getMaxBpm(s.bpm);
    if (p.bpmMin && maxBpm < Number(p.bpmMin)) return false;
    if (p.bpmMax && maxBpm > Number(p.bpmMax)) return false;
    if (p.isSofran && !s.bpm?.includes("-")) return false;

    if (p.notesMin && s.notes < Number(p.notesMin)) return false;
    if (p.notesMax && s.notes > Number(p.notesMax)) return false;

    if (p.search) {
      const target = s.title.toLowerCase();
      const word = p.search.toLowerCase();
      if (!target.includes(word)) return false;
    }
    return true;
  });
};

/**
 * フロントエンド用
 */
export const filterSongsFrontend = (
  data: SongWithScore[],
  params: FilterParamsFrontend,
): SongWithScore[] => {
  return data.filter((song) => {
    if (!song) return false;
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      if (!song.title.toLowerCase().includes(searchLower)) return false;
    }

    if (params.levels && params.levels.length > 0) {
      if (!params.levels.includes(song.difficultyLevel)) return false;
    }

    if (params.difficulties && params.difficulties.length > 0) {
      if (!params.difficulties.includes(song.difficulty as Difficulties))
        return false;
    }

    if (params.clearStates && params.clearStates.length > 0) {
      const state = song.clearState || "NO PLAY";
      if (!params.clearStates.includes(state)) return false;
    }

    if (params.versions && params.versions.length > 0) {
      if (
        !song.releasedVersion ||
        !params.versions.includes(song.releasedVersion)
      )
        return false;
    }

    const isSongSofran = song.bpm
      ? song.bpm.includes("-") || song.bpm.includes("~")
      : "";
    if (params.isSofran && !isSongSofran) return false;

    if (params.bpmMin || params.bpmMax) {
      const bpmParts = (song.bpm ?? "").split(/[-~]/).map((b) => parseInt(b));
      const minBpm = bpmParts[0];
      const maxBpm = bpmParts[bpmParts.length - 1];

      if (params.bpmMin && maxBpm < params.bpmMin) return false;
      if (params.bpmMax && minBpm > params.bpmMax) return false;
    }

    if (params.since) {
      if (!song.scoreAt) return false;
      const scoreDate = dayjs(song.scoreAt);
      const now = dayjs();
      const today = now.startOf("day");

      const presets: Record<string, () => boolean> = {
        today: () => scoreDate.isSame(today, "day"),
        yesterday: () => scoreDate.isSame(today.subtract(1, "day"), "day"),

        thisWeek: () => scoreDate.isSame(now, "week"),
        thisMonth: () => scoreDate.isSame(now, "month"),

        past7: () => scoreDate.isAfter(now.subtract(7, "day")),
        past30: () => scoreDate.isAfter(now.subtract(30, "day")),
      };

      if (presets[params.since]) {
        if (!presets[params.since]()) return false;
      } else {
        const start = dayjs(params.since).startOf("day");
        const end = params.until
          ? dayjs(params.until).endOf("day")
          : dayjs().endOf("day");

        if (!scoreDate.isBetween(start, end, null, "[]")) return false;
      }
    } else if (params.until && song.scoreAt) {
      const scoreDate = dayjs(song.scoreAt);
      const end = dayjs(params.until).endOf("day");
      if (scoreDate.isAfter(end)) return false;
    }

    return true;
  });
};
