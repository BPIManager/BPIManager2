/** BPM帯（ソフラン除く）の範囲。min は以上、max は未満 */
export const BPM_BANDS = [
  { label: "200~", min: 200, max: Infinity },
  { label: "180~200", min: 180, max: 200 },
  { label: "160~180", min: 160, max: 180 },
  { label: "140~160", min: 140, max: 160 },
  { label: "120~140", min: 120, max: 140 },
  { label: "~120", min: 0, max: 120 },
] as const;

/** ソフラン曲（BPMが範囲表記）をまとめる帯のラベル */
export const SOFLAN_BAND_LABEL = "Soflan";

/** BPM帯域定数とBPI範囲定数 */
const BPM_BAND_ORDER = [
  "200~",
  "180~200",
  "160~180",
  "140~160",
  "120~140",
  "~120",
  "Soflan",
];
const BPI_MIN = -15;
const BPI_MAX = 100;
const BPI_RANGE = BPI_MAX - BPI_MIN;

export const BPM_CONST = {
  BPM_BAND_ORDER,
  BPI_MIN,
  BPI_MAX,
  BPI_RANGE,
};
