/** タイムラインの表示モード。`"all"` 全件、`"played"` 自分もプレイ済み、`"overtaken"` 抜かれた楽曲 */
export type TimelineMode = "all" | "played" | "overtaken";

/** タイムラインの1エントリ */
export interface TimelineEntry {
  logId: number;
  userId: string;
  userName: string;
  profileImage: string | null;
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  lastPlayed: string;
  /** WR スコア */
  wrScore: number;
  /** 皆伝平均 */
  kaidenAvg: number;
  /** 閲覧者が抜かれているか */
  isOvertaken: boolean;
  /** ライバルのスコア変化情報 */
  opponentScore: {
    currentEx: number;
    prevEx: number | null;
    diffEx: number | null;
    currentBpi: number;
    prevBpi: number | null;
    diffBpi: number | null;
  };
  /** 閲覧者のスコアとライバルとの差分（未プレイの場合 null） */
  viewerScore: {
    exScore: number;
    bpi: number;
    clearState: string | null;
    diffFromOpponentEx: number;
    diffFromOpponentBpi: number;
  } | null;
}
