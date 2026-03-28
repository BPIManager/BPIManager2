/** チャート描画に使用するテーマカラーのセット */
export interface ChartColors {
  /** プライマリカラー（HSL 文字列） */
  primary: string;
  /** 警告色（HSL 文字列） */
  warning: string;
  /** 成功色（HSL 文字列） */
  success: string;
  /** 危険色（HSL 文字列） */
  danger: string;
  /** ミュートテキスト色（HSL 文字列） */
  muted: string;
  /** グリッド線色（HSL 文字列） */
  grid: string;
  /** 背景色（HSL 文字列） */
  surface: string;
  /** オーバーレイ色（HSL 文字列） */
  overlay: string;
  /** プライマリカラーを指定透明度の rgba 文字列に変換する関数 */
  primaryRgba: (opacity: number) => string;
  /** 警告色を指定透明度の rgba 文字列に変換する関数 */
  warningRgba: (opacity: number) => string;
  /** ミュート色を指定透明度の rgba 文字列に変換する関数 */
  mutedRgba: (opacity: number) => string;
}

export interface ChartData {
  label: string;
  count: number;
}
