export interface PerformancePlay {
  songId: number;
  title: string;
  difficulty: string;
  level: number;
  exScore: number;
  bpi: number | null;
  /** プレイ時刻(UNIXミリ秒) */
  playedAt: number;
}

/** 1プレイ日ぶんのサマリー。keyCount/scratchCount はIIDXタワー未取込の日は null */
export interface PerformanceDay {
  date: string;
  songCount: number;
  firstPlayedAt: number;
  lastPlayedAt: number;
  /** 最初〜最後のプレイ記録の間隔(分) */
  playMinutes: number;
  /** サマリータブの「今日のBPI」と同じ指標(☆12更新曲のべき乗平均)。☆12の更新が無い日は null */
  sessionBpi: number | null;
  keyCount: number | null;
  scratchCount: number | null;
}

export interface PerformanceResponse {
  date: string;
  plays: PerformancePlay[];
  /** 対象日にプレイ記録が無ければ null */
  target: PerformanceDay | null;
  /** 対象日より前のプレイ日(新しい順、最大30日) */
  past: PerformanceDay[];
  /** 対象日のIIDXタワー記録があるか */
  hasTowerData: boolean;
}
