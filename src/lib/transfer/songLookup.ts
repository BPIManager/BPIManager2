import { SongMaster, SongWithDef } from "@/types/songs/songMaster";

/**
 * 楽曲マスタを「タイトル + 難易度」のキーで高速検索するためのルックアップクラス。
 * インポート処理などで大量の楽曲検索を行う際に、線形探索を避けるために使用する。
 */
export class SongLookup {
  private lookupMap: Map<string, SongWithDef> = new Map();

  /**
   * 楽曲マスタからルックアップインデックスを構築する。
   *
   * @param songMaster - インデックス化する楽曲マスタ配列
   */
  constructor(songMaster: SongMaster) {
    songMaster.forEach((song) => {
      const key = `${song.title}_${song.difficulty?.toLowerCase()}`;
      this.lookupMap.set(key, song);
    });
  }

  /**
   * タイトルと難易度で楽曲を検索する。
   *
   * @param title - 楽曲タイトル
   * @param difficulty - 難易度文字列（大文字小文字は区別しない）
   * @returns 一致した楽曲データ、見つからない場合は `undefined`
   */
  find(title: string, difficulty: string): SongWithDef | undefined {
    const key = `${title}_${difficulty.toLowerCase()}`;
    return this.lookupMap.get(key);
  }
}
