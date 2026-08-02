export const styles = `
  @keyframes rivalIn { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
  @keyframes songIn  { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
  @keyframes titleIn { from{opacity:0;letter-spacing:0.6em} to{opacity:1;letter-spacing:0.2em} }
  @keyframes chartFade { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
`;

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

export const SONG_PAGE = 3;
export const PAGE = 3;
