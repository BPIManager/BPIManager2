/** アプリで利用可能なテーマ ID の Union 型 */
export type ThemeId =
  | "dark-blue"
  | "dark-green"
  | "dark-red"
  | "dark-orange"
  | "dark-yellow"
  | "dark-purple"
  | "dark-pink"
  | "dark-cyan"
  | "dark-abyss"
  | "dark-midnight"
  | "dark-forest"
  | "dark-ember"
  | "dark-onsen"
  | "light-blue"
  | "light-green"
  | "light-rose"
  | "light-purple";

/** テーマの定義情報 */
export interface ThemeDef {
  /** テーマ識別子 */
  id: ThemeId;
  /** 表示名 */
  label: string;
  /** ダーク / ライトモード */
  mode: "dark" | "light";
  /** アクセントカラー名称 */
  accent: string;
  /** テーマ選択 UI 用のプレビューカラー */
  preview: {
    bg: string;
    surface: string;
    primary: string;
    text: string;
  };
}
