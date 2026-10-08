import { Score } from "@/types/db";
import type { IBpiBasicSongData } from "@/types/songs/bpi";

export interface RivalScore {
  userId?: string | null;
  userName?: string | null;
  exScore: number | null;
  bpi: number | null;
  clearState: string | null;
  missCount: number | null;
  lastPlayed: Date | string | null;
}

export interface SongWithScore
  extends Pick<
    IBpiBasicSongData,
    "notes" | "kaidenAvg" | "wrScore" | "coef" | "mu" | "sigma" | "residualVar"
  > {
  // 楽曲基本情報
  songId: number;
  title: string;
  bpm: string | null;
  difficulty: string;
  difficultyLevel: number;
  releasedVersion: number | null;

  // 自分のスコア詳細
  logId: number | null;
  exScore: number | null;
  /** BPI算出対象外の楽曲（全曲ページの☆10以下等）ではキー自体を省略する */
  bpi?: number | null;
  clearState: string | null;
  missCount: number | null;
  scoreAt: Date | string | null;

  radarTop?: string | null;

  /** 歴代県別タブ: 1位を獲得したエリア(eagateのpref_id)。通常のスコア一覧では未設定 */
  areaId?: number;

  rival?: RivalScore | null;

  exDiff?: number;
  bpiDiff?: number;
  lastPlayedMax?: Date | string | null;

  djRankDisplay?: {
    current: string;
    next: string;
  };
  isRankUp?: boolean;
}

export interface SongWithRival extends SongWithScore {
  rival: RivalScore;
  /** 複数ターゲット比較時のみ。ターゲットごとの比較結果（先頭が`rival`/`exDiff`/`bpiDiff`と同じ） */
  targets?: TargetComparison[];
}

/** 1ターゲット分の比較結果（自分とのEX差・BPI差を含む） */
export interface TargetComparison {
  rival: RivalScore | null;
  exDiff?: number;
  bpiDiff?: number;
}

/** ライバル(比較ターゲット)に紐づくソートキー。複数ターゲット時は`<key>#<ターゲットindex>`で2件目以降を指す */
export type RivalSortKey =
  | "rivalBpi"
  | "rivalRate"
  | "exGap"
  | "bpiGap"
  | "rivalUpdated";

export type SongForSort = SongWithScore;

export interface ScoreFilterCondition {
  id: string;
  metric: "scoreRate" | "djrank";
  operator: ">=" | "<=";
  value: string;
}

export interface FilterParamsFrontend {
  /** BPI対象の`IidxDifficulty`に加え、全曲ページ用の`AllDifficulties`（BEGINNER/NORMAL）も許容する */
  difficulties?: string[];
  levels?: number[];
  clearStates?: string[];
  versions?: number[];

  bpiMin?: number;
  bpiMax?: number;
  bpmMin?: number;
  bpmMax?: number;
  isSofran?: boolean;
  notesMin?: number;
  notesMax?: number;

  isMyPlayed?: boolean;
  isRivalPlayed?: boolean;

  search?: string;
  since?:
    | "today"
    | "yesterday"
    | "thisWeek"
    | "thisMonth"
    | "past7"
    | "past30"
    | string;
  until?: string | undefined;
  sortKey?:
    | "title"
    | "level"
    | "bpi"
    | "exScore"
    | "notes"
    | "bpm"
    | "updatedAt"
    | "version"
    | RivalSortKey
    | `${RivalSortKey}#${number}`
    | "myBpi"
    | "myRate"
    | "myUpdated"
    | "scoreRate";
  sortOrder?: "asc" | "desc";
  compareVersion?: string;

  scoreFilters?: ScoreFilterCondition[];
  missCountMin?: number;
  missCountMax?: number;
  radarCategories?: string[];
}

export type SongHistoryResponse = {
  [version: string]: Score[];
};
