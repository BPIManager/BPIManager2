import { SongMaster, SongWithDef } from "@/types/songs/songMaster";

export class SongLookup {
  private lookupMap: Map<string, SongWithDef> = new Map();

  constructor(songMaster: SongMaster) {
    songMaster.forEach((song) => {
      const key = `${song.title}_${song.difficulty?.toLowerCase()}`;
      this.lookupMap.set(key, song);
    });
  }

  find(title: string, difficulty: string): SongWithDef | undefined {
    const key = `${title}_${difficulty.toLowerCase()}`;
    return this.lookupMap.get(key);
  }
}
