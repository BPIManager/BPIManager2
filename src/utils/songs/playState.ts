/** スコア一覧の「プレイ状態」の既定。null はプレイ済み・未プレイの両方を表示する */
export const SCORE_LIST_DEFAULT_PLAY_STATE: boolean | null = null;

/**
 * URL の `isMyPlayed`（未指定=既定、"true"=プレイ済みのみ、"false"=未プレイのみ、"any"=すべて）から、
 * 未プレイ曲のデータを取得して一覧に加える必要があるかを返す。
 */
export function needsUnplayedSongs(param: string | string[] | undefined): boolean {
  if (Array.isArray(param)) return needsUnplayedSongs(param[0]);
  const state =
    param === undefined
      ? SCORE_LIST_DEFAULT_PLAY_STATE
      : param === "any"
        ? null
        : param === "true";
  return state !== true;
}
