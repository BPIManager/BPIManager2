import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * clsx と tailwind-merge による条件付きクラス結合と Tailwind 競合解決。
 *
 * @param inputs - 結合するクラス値（文字列・オブジェクト・配列など）
 * @returns マージ済みのクラス名文字列
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
