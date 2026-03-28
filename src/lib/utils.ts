import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * clsx と tailwind-merge を組み合わせたクラス名ユーティリティ。
 * 条件付きクラスを安全に結合し、Tailwind クラスの競合を解決する。
 *
 * @param inputs - 結合するクラス値（文字列・オブジェクト・配列など）
 * @returns マージ済みのクラス名文字列
 *
 * @example
 * ```ts
 * cn("px-4 py-2", isActive && "bg-blue-500", "bg-red-500")
 * // => "px-4 py-2 bg-red-500"  (tailwind-merge が競合を解決)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
