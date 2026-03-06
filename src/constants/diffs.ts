export const IIDX_LEVELS = ["11", "12"] as const;
export const IIDX_DIFFICULTIES = ["HYPER", "ANOTHER", "LEGGENDARIA"] as const;

export type IidxLevel = (typeof IIDX_LEVELS)[number];
export type IidxDifficulty = (typeof IIDX_DIFFICULTIES)[number];
