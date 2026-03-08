import { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
  songs: SongsTable;
  songDef: SongDefTable;
  users: UsersTable;
  scores: ScoresTable;
  logs: LogsTable;
  userStatusLogs: UserStatusLogsTable;
  apiKeys: ApiKeysTable;
  // 追加: 暫定/バックアップ用テーブル
  bkScores: BkScoresTable;
  bkUsers: BkUsersTable;
  follows: FollowsTable;
}

export interface FollowsTable {
  id: Generated<number>;
  followerId: string;
  followingId: string;
  createdAt: Generated<Date>;
}

export type Follow = Selectable<FollowsTable>;
export type NewFollow = Insertable<FollowsTable>;

// --- [bkScores] (新規追加) ---
export interface BkScoresTable {
  logId: Generated<number>;
  userId: string;
  title: string;
  difficulty: string;
  difficultyLevel: number | null;
  exScore: number;
  bpi: number | null;
  clearState: number | null;
  missCount: number | null;
  version: string | null;
  lastPlayed: Date | string | null;
  createdAt: Generated<Date>;
}

export type BkScore = Selectable<BkScoresTable>;
export type NewBkScore = Insertable<BkScoresTable>;

// --- [bkUsers] (新規追加) ---
export interface BkUsersTable {
  userId: string;
  userName: string;
  arenarank: string | null; // SQLの定義に合わせて小文字のr
  currentTotalBpi: number | null;
}

export type BkUser = Selectable<BkUsersTable>;
export type NewBkUser = Insertable<BkUsersTable>;

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
  profileText: string | null;
  profileImage: string | null;
  iidxId: string | null;
  xId: string | null;
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

// --- [userStatusLogs] ---
export interface UserStatusLogsTable {
  id: Generated<number>;
  userId: string;
  totalBpi: number;
  arenaRank: string | null;
  version: string;
  batchId: string | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export type UserStatusLog = Selectable<UserStatusLogsTable>;
export type NewUserStatusLog = Insertable<UserStatusLogsTable>;
