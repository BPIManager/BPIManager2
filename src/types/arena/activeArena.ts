export interface ActiveArenaData {
  generatedAt: string;
  prevFetchedAt: string | null;
  byClass: Record<string, number>;
}
