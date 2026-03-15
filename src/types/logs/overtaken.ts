export interface OvertakenRivalInfo {
  rivalUserId: string;
  rivalName: string;
  rivalProfileImage: string | null;
  rivalScore: number;
  myNewScore: number;
  myOldScore: number | null;
}

export type OvertakenMap = Record<number, OvertakenRivalInfo[]>;
