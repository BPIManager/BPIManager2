/** 楽曲モーダルで自分と並べて表示する比較対象（ライバル・旧バージョン自己・アリーナ平均等） */
export interface SongCompareTarget {
  /** グラフのX軸ラベル兼、ランキング上の区別用ラベル */
  label: string;
  /** ツールチップ等で使う表示名（未指定なら label） */
  name?: string;
  exScore: number | null;
  /** ユーザーに紐づく対象のみ。ランキング上の既存行と突き合わせる */
  userId?: string;
  color: string;
}
