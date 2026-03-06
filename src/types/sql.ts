import { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
  songs: SongsTable;
  songDef: SongDefTable;
  users: UsersTable;
  scores: ScoresTable;
}

// --- [songs] ---
export interface SongsTable {
  songId: Generated<number>;
  title: string;
  notes: number;
  bpm: string | null;
  difficulty: string | null;
  difficultyLevel: number | null;
  textage: string | null;
  createdAt: Generated<Date>; // DEFAULT current_timestamp()
}

export type Song = Selectable<SongsTable>;
export type NewSong = Insertable<SongsTable>;
export type SongUpdate = Updateable<SongsTable>;

// --- [songDef] ---
export interface SongDefTable {
  defId: Generated<number>;
  songId: number | null;
  wrScore: number;
  kaidenAvg: number;
  coef: Generated<number | null>; // DEFAULT -1
  isCurrent: Generated<number | null>; // TINYINT(1) DEFAULT '0'
  updatedAt: Generated<Date>; // DEFAULT current_timestamp() ON UPDATE...
}

export type SongDef = Selectable<SongDefTable>;
export type NewSongDef = Insertable<SongDefTable>;
export type SongDefUpdate = Updateable<SongDefTable>;

// --- [users] ---
export interface UsersTable {
  userId: string;
  userName: string;
  currentTotalBpi: Generated<number | null>;
  profileText: string | null;
  profileImage: string | null;
  iidxId: string | null;
  xId: string | null;
  arenaRank: string | null;
  isPublic: Generated<number | null>; /** 0: Private, 1: Public */
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

// --- [scores] ---
export interface ScoresTable {
  logId: Generated<number>;
  userId: number | null;
  songId: number | null;
  definitionId: number | null;
  exScore: number;
  bpi: number;
  createdAt: Generated<Date | null>;
}

export type Score = Selectable<ScoresTable>;
export type NewScore = Insertable<ScoresTable>;
export type ScoreUpdate = Updateable<ScoresTable>;
