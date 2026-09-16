export interface OvertakenRivalInfo {
  rivalUserId: string;
  rivalName: string;
  rivalProfileImage: string | null;
  rivalScore: number;
  myNewScore: number;
  myOldScore: number | null;
}

export type OvertakenMap = Record<number, OvertakenRivalInfo[]>;

/** ライバルではなく別バージョンの自分自身のスコアを追い抜いた場合の情報 */
export interface VersionOvertakenInfo {
  targetVersion: string;
  targetVersionLabel: string;
  targetScore: number;
  myNewScore: number;
  myOldScore: number | null;
}

export type VersionOvertakenMap = Record<number, VersionOvertakenInfo[]>;
