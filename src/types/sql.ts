import { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
  songs: SongsTable;
  songDef: SongDefTable;
  users: UsersTable;
  scores: ScoresTable;
  logs: LogsTable;
  apiKeys: ApiKeysTable;
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
  createdAt: Generated<Date>;
  deletedAt: string | null;
  releasedVersion: number | null;
}

export type Song = Selectable<SongsTable>;

// --- [songDef] ---
export interface SongDefTable {
  defId: Generated<number>;
  songId: number | null;
  difficulty: string;
  wrScore: number;
  kaidenAvg: number;
  coef: Generated<number | null>;
  isCurrent: Generated<number | null>;
  updatedAt: Generated<Date>;
}

export type SongDef = Selectable<SongDefTable>;

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
  isPublic: Generated<number>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export type User = Selectable<UsersTable>;

// --- [scores] ---
export interface ScoresTable {
  logId: Generated<number>;
  userId: string | null;
  songId: number | null;
  definitionId: number | null;
  exScore: number;
  bpi: number;
  clearState: string | null;
  missCount: number | null;
  version: string | null;
  batchId: string | null;
  createdAt: Generated<Date | null>;
  lastPlayed: Date | string;
}

export type Score = Selectable<ScoresTable>;
export type NewScore = Insertable<ScoresTable>;

// --- [logs] ---
export interface LogsTable {
  id: Generated<number>;
  userId: string;
  totalBpi: number;
  version: string;
  batchId: string;
  createdAt: Generated<Date>;
}

export type TotalBPILog = Selectable<LogsTable>;
export type NewTotalBPILog = Insertable<LogsTable>;

// --- [apiKeys] ---
export interface ApiKeysTable {
  id: Generated<number>;
  userId: string;
  key: string;
  createdAt: Generated<Date>;
}

export type ApiKey = Selectable<ApiKeysTable>;
export type NewApiKey = Insertable<ApiKeysTable>;
export type ApiKeyUpdate = Updateable<ApiKeysTable>;
