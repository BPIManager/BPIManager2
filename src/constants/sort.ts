import { createListCollection } from "@chakra-ui/react";

export const rivalSortOptions = [
  { label: "ライバルのBPIが高い順", value: "rivalBpi" },
  { label: "自分のBPIが高い順", value: "myBpi" },
  { label: "ライバルのスコアレート順", value: "rivalRate" },
  { label: "自分のスコアレート順", value: "myRate" },
  { label: "EX:差が小さい順（自分勝ち）", value: "winGapAsc" },
  { label: "EX:差が大きい順（自分勝ち）", value: "winGapDesc" },
  { label: "EX:差が小さい順（ライバル勝ち）", value: "loseGapAsc" },
  { label: "EX:差が大きい順（ライバル勝ち）", value: "loseGapDesc" },
  { label: "BPI:差が小さい順（自分勝ち）", value: "winBpiGapAsc" },
  { label: "BPI:差が大きい順（自分勝ち）", value: "winBpiGapDesc" },
  { label: "BPI:差が小さい順（ライバル勝ち）", value: "loseBpiGapAsc" },
  { label: "BPI:差が大きい順（ライバル勝ち）", value: "loseBpiGapDesc" },
  { label: "ライバルの更新時間順", value: "rivalUpdated" },
  { label: "自分の更新時間順", value: "myUpdated" },
];

export const soleSortOptions = [
  { label: "BPIが高い順", value: "bpi" },
  { label: "最近更新", value: "updatedAt" },
];

export const sortOptions = createListCollection({
  items: [
    { label: "レベル", value: "level" },
    { label: "楽曲名", value: "title" },
  ],
});
