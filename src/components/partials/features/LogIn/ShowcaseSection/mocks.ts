export const BPI_HISTORY_MOCK = [
  { date: "4月", bpi: 14.2, count: 3 },
  { date: "5月", bpi: 16.8, count: 12 },
  { date: "6月", bpi: 20.4, count: 8 },
  { date: "7月", bpi: 22.1, count: 5 },
  { date: "8月", bpi: 25.6, count: 14 },
  { date: "9月", bpi: 28.3, count: 9 },
  { date: "10月", bpi: 31.7, count: 11 },
  { date: "11月", bpi: 34.2, count: 7 },
  { date: "12月", bpi: 36.9, count: 10 },
  { date: "1月", bpi: 40.1, count: 15 },
  { date: "2月", bpi: 43.5, count: 8 },
  { date: "3月", bpi: 47.83, count: 13 },
];

export const RADAR_MOCK_DATA = [
  { category: "NOTES", value: 52, rivalValue: 44 },
  { category: "CHORD", value: 38, rivalValue: 55 },
  { category: "PEAK", value: 61, rivalValue: 43 },
  { category: "CHARGE", value: 44, rivalValue: 39 },
  { category: "SCRATCH", value: 29, rivalValue: 62 },
  { category: "SOFLAN", value: 55, rivalValue: 41 },
];

export const BPM_MOCK_DATA = [
  { label: "~99", myBpi: 41, rivalBpi: 35 },
  { label: "100~139", myBpi: 48, rivalBpi: 52 },
  { label: "140~159", myBpi: 36, rivalBpi: 41 },
  { label: "160~179", myBpi: 52, rivalBpi: 45 },
  { label: "180~199", myBpi: 29, rivalBpi: 38 },
  { label: "200+", myBpi: 19, rivalBpi: 22 },
];

export const BPI_DIST_MOCK = [
  { label: "<-10", bpi: -15 },
  { label: "-10~0", bpi: -5 },
  { label: "0~10", bpi: 5 },
  { label: "10~20", bpi: 15 },
  { label: "20~30", bpi: 25 },
  { label: "30~40", bpi: 35 },
  { label: "40~50", bpi: 45 },
  { label: "50~60", bpi: 55 },
  { label: "60~70", bpi: 65 },
  { label: "70~80", bpi: 75 },
  { label: "80+", bpi: 85 },
];
export const BPI_DIST_COUNTS = [8, 24, 45, 52, 41, 34, 22, 14, 8, 5, 2];

export const ACTIVITY_MOCK = [
  0, 1, 0, 2, 0, 1, 3, 0, 0, 1, 0, 2, 1, 0, 0, 1, 0, 3, 0, 1, 1, 0, 2, 0, 1, 0,
  2, 1, 0, 2, 0, 1, 3, 0, 1, 0, 2, 0, 1, 0, 0, 2, 0, 1, 3, 0, 1, 0, 2, 0, 3, 2,
  0, 1, 0, 2, 1, 0, 2, 0, 1, 0, 3, 0, 0, 2, 0, 3, 1, 0, 1, 0, 2, 3, 0, 1, 0, 2,
  0, 1, 0, 1, 0, 2, 1, 0, 2, 0, 1, 3, 0, 1, 0, 2, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0,
  3, 1, 0, 2, 0, 1, 2, 0, 1, 3, 0, 1, 0, 2, 1, 0, 0, 3, 0, 1, 0, 2, 1, 0, 2, 0,
  1, 3, 0, 0, 2, 0, 1, 0, 3, 1,
];

export const ACTIVITY_COLORS = [
  "var(--activity-0)",
  "var(--activity-1)",
  "var(--activity-2)",
  "var(--activity-3)",
  "var(--activity-4)",
];

export const CHART_ANIMS = `
  @keyframes growWidth { from { width: 0 } }
  @keyframes bounceGrow {
    0%   { transform: scaleY(0); }
    60%  { transform: scaleY(1.1); }
    80%  { transform: scaleY(0.95); }
    100% { transform: scaleY(1); }
  }
`;

export const RIVAL_ROWS = [
  { name: "ライバルA", win: 142, draw: 23, lose: 89, total: 254 },
  { name: "ライバルB", win: 98, draw: 31, lose: 125, total: 254 },
  { name: "ライバルC", win: 187, draw: 18, lose: 49, total: 254 },
];
