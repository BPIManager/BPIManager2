const DIFF_SUFFIX: Record<string, string> = {
  HYPER: "h",
  ANOTHER: "a",
  LEGGENDARIA: "l",
};

export function buildTextageUrl(
  textage: string | null | undefined,
  side: 1 | 2,
  ticketId?: string,
): string | null {
  if (!textage) return null;
  const base = `https://textage.cc/score/${textage.replace("?1", "?" + side)}`;
  if (!ticketId) return base;
  return `${base}R0${ticketId}01234567`;
}

export function buildChartViewerUrl(
  textage: string | null | undefined,
  difficulty: string,
): string | null {
  if (!textage) return null;
  const base = textage.split(".html")[0];
  const suffix = DIFF_SUFFIX[difficulty];
  if (!suffix) return null;
  return `https://textage-chart-viewer.vercel.app/chart/${base}/${suffix}`;
}
