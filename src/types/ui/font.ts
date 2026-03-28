/** アプリで利用可能なフォント ID の Union 型 */
export type FontId =
  | "default"
  | "mplus"
  | "sawarabi-mincho"
  | "sawarabi-gothic"
  | "noto-sans-jp";

/** フォントの定義情報 */
export interface FontDef {
  /** フォント識別子 */
  id: FontId;
  /** 表示名 */
  label: string;
  /** Google Fonts URL パラメータ（null の場合は Google Fonts を使用しない） */
  googleParam: string | null;
  /** CSS `font-family` 値 */
  cssFamily: string;
}
