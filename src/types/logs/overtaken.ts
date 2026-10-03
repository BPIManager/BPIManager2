export interface OvertakenRivalInfo {
  rivalUserId: string;
  rivalName: string;
  rivalProfileImage: string | null;
  rivalScore: number;
  myNewScore: number;
  myOldScore: number | null;
}

export type OvertakenMap = Record<number, OvertakenRivalInfo[]>;

/**
 * 別バージョンの自分自身のスコアとの比較情報。プレイ済みの組み合わせは全件返り、isNewOvertake で今回新たに追い抜いたかを判定する。
 */
export interface VersionOvertakenInfo {
  targetVersion: string;
  targetVersionLabel: string;
  targetScore: number;
  myNewScore: number;
  myOldScore: number | null;
  /** myNewScore - targetScore。負の値は「まだそのバージョンに負けている」ことを表す */
  diff: number;
  /** このバッチ内で新たに追い抜いた（かつ既存の追い抜き済みではない）かどうか */
  isNewOvertake: boolean;
}

export type VersionOvertakenMap = Record<number, VersionOvertakenInfo[]>;
