export const officialArenaFetcher = (url: string) =>
  fetch(url).then((r) => r.json());
