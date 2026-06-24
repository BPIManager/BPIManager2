/** BPI計算対象のレベル・難易度定数と型 */
export const IIDX_LEVELS: BPI_CALCABLE_LEVELS[] = ["11", "12"] as const;
export const IIDX_DIFFICULTIES: BPI_CALCABLE_DIFFICULTIES[] = [
  "HYPER",
  "ANOTHER",
  "LEGGENDARIA",
] as const;

export type BPI_CALCABLE_LEVELS = "11" | "12";
export type BPI_CALCABLE_DIFFICULTIES = "HYPER" | "ANOTHER" | "LEGGENDARIA";
