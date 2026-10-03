/** 月次まとめの JST 日付境界（UTC の Date に変換）。 */
export const jstDayStart = (jstDate: string): Date =>
  new Date(`${jstDate}T00:00:00+09:00`);

export const jstDayEnd = (jstDate: string): Date =>
  new Date(`${jstDate}T23:59:59.999+09:00`);
