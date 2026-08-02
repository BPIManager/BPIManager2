export const styles = `
  @keyframes radarFade { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes radarRow  { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes titleIn   { from{opacity:0;letter-spacing:0.6em} to{opacity:1;letter-spacing:0.2em} }
`;

export const ELEMENT_LABELS: Record<string, string> = {
  NOTES: "NOTES",
  CHORD: "CHORD",
  PEAK: "PEAK",
  CHARGE: "CHARGE",
  SCRATCH: "SCRATCH",
  SOFLAN: "SOFLAN",
};
export const ELEMENT_COLORS: Record<string, string> = {
  NOTES: "#38bdf8",
  CHORD: "#a78bfa",
  PEAK: "#f59e0b",
  CHARGE: "#34d399",
  SCRATCH: "#f87171",
  SOFLAN: "#fb923c",
};

export const DIFF_COLORS: Record<string, string> = {
  HYPER: "#f59e0b",
  ANOTHER: "#ef4444",
  LEGGENDARIA: "#a855f7",
};
export const DIFF_LABELS: Record<string, string> = {
  HYPER: "H",
  ANOTHER: "A",
  LEGGENDARIA: "L",
};

export const PAGE = 5;
